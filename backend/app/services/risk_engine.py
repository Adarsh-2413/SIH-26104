# backend/app/services/risk_engine.py
"""
Risk Fusion Engine — SIH-26104 Voice Anti-Spoofing Detection
============================================================

This module provides an isolated, pluggable Risk Fusion Engine that combines
multiple voice anti-spoofing and biometric indicators into a unified Risk Score
(0–100) and categorical Risk Level (SAFE / SUSPICIOUS / CRITICAL).

ARCHITECTURE & REPLACEABILITY:
------------------------------
This engine is deliberately decoupled from the WebSocket handler, ML models,
and data persistence layers. It defines an abstract base interface
(`BaseRiskFusionEngine`) so that:
  - The fusion heuristic is completely isolated in this dedicated file.
  - The WebSocket handler never contains hardcoded scoring or threshold math.
  - A machine-learned calibration model (e.g. Logistic Regression, GBDT,
    or Bayesian belief network) trained on empirical benchmark datasets
    (e.g., ASVspoof, In-the-Wild) can replace it without changing any callers.

INITIAL HEURISTIC SPECIFICATION:
--------------------------------
The initial heuristic uses a linear weighted combination of normalized inputs:
  1. spoof_probability (weight: w_spoof, default 0.55):
     Direct probability from the acoustic anti-spoofing model that audio is synthetic.
  2. speaker_similarity (weight: w_speaker, default 0.25):
     Voice biometric match against enrolled speaker profile. Inverted as
     (1.0 - speaker_similarity) so lower speaker match yields higher risk.
  3. prosodic_anomaly (weight: w_prosodic, default 0.10):
     Irregular pitch contours, unnatural rhythmic pacing, or robotic speech.
  4. phonetic_evidence (weight: w_phonetic, default 0.05):
     Optional phonetic-level transition artifact score (0.0–1.0). If absent or None,
     weights are dynamically normalized across available inputs.
  5. context_risk (weight: w_context, default 0.05):
     Contextual anomalies (e.g. unusual call timing, device anomalies).

Raw score formula:
  raw_score = (spoof_probability * w_spoof)
            + ((1.0 - speaker_similarity) * w_speaker)
            + (prosodic_anomaly * w_prosodic)
            + (phonetic_val * w_phonetic)
            + (context_risk * w_context)

Final scaling:
  risk_score = int(round(clamp(raw_score, 0.0, 1.0) * 100))

Classification Thresholds:
  - 0  <= risk_score <= 39  → SAFE
  - 40 <= risk_score <= 69  → SUSPICIOUS
  - 70 <= risk_score <= 100 → CRITICAL

CRITICAL DISCLAIMER (NON-OPTIMALITY NOTICE):
--------------------------------------------
These weights and thresholds represent an initial heuristic designed for system
integration, prototyping, and demonstration.
THEY ARE NOT CLAIMED TO BE SCIENTIFICALLY OPTIMAL OR STATISTICALLY CALIBRATED.
Real-world deployment requires empirical calibration against held-out validation
corpora to optimize for Target Operating Points (e.g., Equal Error Rate (EER) or
minDCF cost metrics).
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Union

from app.config import settings
from app.models.schemas import FusionOutput, MLResult, RiskResult

logger = logging.getLogger(__name__)


# ─── Configurable Weights & Thresholds ────────────────────────────────────────

@dataclass
class RiskWeights:
    """
    Configurable weights for the risk fusion formula.
    Must sum to 1.0. Configurable via .env or constructor.
    """
    spoof: float = 0.55
    speaker: float = 0.25
    prosodic: float = 0.10
    phonetic: float = 0.05
    context: float = 0.05

    def validate(self) -> None:
        """Log a warning if weights do not sum close to 1.0."""
        total = self.spoof + self.speaker + self.prosodic + self.phonetic + self.context
        if not (0.98 <= total <= 1.02):
            logger.warning(
                "[Risk Engine] Weights sum to %.4f (expected 1.0). "
                "Scores may be skewed.", total
            )

    def normalized_without_phonetic(self) -> tuple[float, float, float, float]:
        """
        Return normalized weights when phonetic evidence is not available.
        Distributes the remaining weight proportionally across spoof, speaker, prosodic, and context.
        """
        sum_without = self.spoof + self.speaker + self.prosodic + self.context
        if sum_without <= 0:
            return 0.60, 0.25, 0.10, 0.05
        return (
            self.spoof / sum_without,
            self.speaker / sum_without,
            self.prosodic / sum_without,
            self.context / sum_without,
        )


@dataclass
class RiskThresholds:
    """
    Configurable classification thresholds.
    Scores 0..safe_max -> SAFE
    Scores (safe_max+1)..suspicious_max -> SUSPICIOUS
    Scores (suspicious_max+1)..100 -> CRITICAL
    """
    safe_max: int = 39
    suspicious_max: int = 69


def load_default_weights() -> RiskWeights:
    """Load fusion weights from app configuration (.env)."""
    w = RiskWeights(
        spoof=settings.RISK_WEIGHT_SPOOF,
        speaker=settings.RISK_WEIGHT_SPEAKER,
        prosodic=settings.RISK_WEIGHT_PROSODIC,
        phonetic=settings.RISK_WEIGHT_PHONETIC,
        context=settings.RISK_WEIGHT_CONTEXT,
    )
    w.validate()
    return w


def load_default_thresholds() -> RiskThresholds:
    """Load risk thresholds from app configuration (.env)."""
    return RiskThresholds(
        safe_max=settings.RISK_THRESHOLD_SAFE_MAX,
        suspicious_max=settings.RISK_THRESHOLD_SUSPICIOUS_MAX,
    )


# ─── Abstract Base Engine (Replaceable Interface) ─────────────────────────────

class BaseRiskFusionEngine(ABC):
    """
    Abstract Base Class for Voice Anti-Spoofing Risk Fusion.

    Subclasses can implement heuristic weighting, statistical calibration,
    logistic regression, Bayesian belief networks, or neural score fusion.
    """

    @abstractmethod
    def fuse(
        self,
        spoof_probability: float,
        speaker_similarity: float,
        prosodic_anomaly: float,
        phonetic_evidence: Optional[Union[float, dict]] = None,
        context_risk: float = 0.0,
    ) -> FusionOutput:
        """
        Fuse individual indicators into a unified Risk Score (0-100) and Level.

        Returns:
            FusionOutput: {"risk_score": int, "risk_level": str}
        """
        pass

    @abstractmethod
    def calculate_risk(self, ml_result: MLResult) -> RiskResult:
        """
        Adapter method consuming an MLResult and producing a RiskResult
        with full evidence telemetry for the WebSocket client.
        """
        pass


# ─── Heuristic Weighted Fusion Engine ─────────────────────────────────────────

class HeuristicWeightedFusionEngine(BaseRiskFusionEngine):
    """
    Default heuristic-weighted implementation of BaseRiskFusionEngine.

    Computes a linear combination of input risk signals:
      - spoof_probability
      - (1.0 - speaker_similarity)
      - prosodic_anomaly
      - phonetic_evidence (optional)
      - context_risk

    DISCLAIMER: These weights are a prototype heuristic and NOT claimed to be
    scientifically optimal.
    """

    def __init__(
        self,
        weights: Optional[RiskWeights] = None,
        thresholds: Optional[RiskThresholds] = None,
    ) -> None:
        self.weights = weights or load_default_weights()
        self.thresholds = thresholds or load_default_thresholds()

    def _extract_phonetic_score(
        self, phonetic_evidence: Optional[Union[float, dict]]
    ) -> Optional[float]:
        """Extract a numeric [0.0, 1.0] score from phonetic evidence input."""
        if phonetic_evidence is None:
            return None
        if isinstance(phonetic_evidence, (int, float)):
            return max(0.0, min(1.0, float(phonetic_evidence)))
        if isinstance(phonetic_evidence, dict):
            # Check common key patterns if dict is provided by ML models
            for key in ("score", "anomaly", "risk", "value"):
                if key in phonetic_evidence and isinstance(phonetic_evidence[key], (int, float)):
                    return max(0.0, min(1.0, float(phonetic_evidence[key])))
        return None

    def _score_to_level(self, score: int) -> str:
        """Map 0-100 integer score into risk category."""
        if score <= self.thresholds.safe_max:
            return "SAFE"
        elif score <= self.thresholds.suspicious_max:
            return "SUSPICIOUS"
        else:
            return "CRITICAL"

    def fuse(
        self,
        spoof_probability: float,
        speaker_similarity: float,
        prosodic_anomaly: float,
        phonetic_evidence: Optional[Union[float, dict]] = None,
        context_risk: float = 0.0,
    ) -> FusionOutput:
        """
        Fuse individual indicators into a unified Risk Score (0-100) and Level.

        Inputs:
            spoof_probability: float [0.0, 1.0]
            speaker_similarity: float [0.0, 1.0]
            prosodic_anomaly: float [0.0, 1.0]
            phonetic_evidence: optional float [0.0, 1.0] or dict
            context_risk: float [0.0, 1.0]

        Output:
            FusionOutput:
                risk_score: int (0–100)
                risk_level: str ("SAFE" | "SUSPICIOUS" | "CRITICAL")
        """
        # Clamp inputs to valid bounds [0.0, 1.0]
        spoof = max(0.0, min(1.0, float(spoof_probability)))
        sim = max(0.0, min(1.0, float(speaker_similarity)))
        prosodic = max(0.0, min(1.0, float(prosodic_anomaly)))
        ctx = max(0.0, min(1.0, float(context_risk)))
        phonetic = self._extract_phonetic_score(phonetic_evidence)

        # Invert speaker similarity: high similarity = genuine (0 risk), low = mismatch (high risk)
        speaker_risk = 1.0 - sim

        if phonetic is not None and self.weights.phonetic > 0:
            raw_score = (
                spoof * self.weights.spoof
                + speaker_risk * self.weights.speaker
                + prosodic * self.weights.prosodic
                + phonetic * self.weights.phonetic
                + ctx * self.weights.context
            )
        else:
            # Re-normalize weights if phonetic evidence is absent
            w_sp, w_sim, w_pr, w_ctx = self.weights.normalized_without_phonetic()
            raw_score = (
                spoof * w_sp
                + speaker_risk * w_sim
                + prosodic * w_pr
                + ctx * w_ctx
            )

        # Scale to 0-100 integer range with robust boundary clamping
        risk_score = int(round(max(0.0, min(1.0, raw_score)) * 100))
        risk_level = self._score_to_level(risk_score)

        logger.debug(
            "[Risk Engine] raw=%.4f score=%d level=%s (spoof=%.3f sim=%.3f prosodic=%.3f phonetic=%s ctx=%.3f)",
            raw_score, risk_score, risk_level, spoof, sim, prosodic, phonetic, ctx,
        )

        return FusionOutput(
            risk_score=risk_score,
            risk_level=risk_level,
        )

    def calculate_risk(self, ml_result: MLResult) -> RiskResult:
        """
        Adapter method consuming MLResult and returning RiskResult with telemetry.
        """
        fusion = self.fuse(
            spoof_probability=ml_result.spoof_probability,
            speaker_similarity=ml_result.speaker_similarity,
            prosodic_anomaly=ml_result.prosodic_anomaly,
            phonetic_evidence=ml_result.phonetic_evidence,
            context_risk=ml_result.context_risk,
        )

        return RiskResult(
            risk_score=fusion.risk_score,
            risk_level=fusion.risk_level,
            spoof_probability=ml_result.spoof_probability,
            speaker_similarity=ml_result.speaker_similarity,
            prosodic_anomaly=ml_result.prosodic_anomaly,
            phonetic_evidence=ml_result.phonetic_evidence,
            context_risk=ml_result.context_risk,
        )


# ─── Module Singleton & Public Helper Functions ───────────────────────────────

# Default module-level engine instance
_default_engine: BaseRiskFusionEngine = HeuristicWeightedFusionEngine()


def get_risk_engine() -> BaseRiskFusionEngine:
    """Return the active Risk Fusion Engine instance."""
    return _default_engine


def set_risk_engine(engine: BaseRiskFusionEngine) -> None:
    """
    Swap the active Risk Fusion Engine instance.
    Enables dependency injection for testing, statistical calibration, or custom engines.
    """
    global _default_engine
    _default_engine = engine
    logger.info("[Risk Engine] Active fusion engine replaced with: %s", type(engine).__name__)


def fuse_risk(
    spoof_probability: float,
    speaker_similarity: float,
    prosodic_anomaly: float,
    phonetic_evidence: Optional[Union[float, dict]] = None,
    context_risk: float = 0.0,
) -> FusionOutput:
    """
    Convenience function: fuse inputs using the active Risk Fusion Engine.

    Output format:
        {
            "risk_score": 86,
            "risk_level": "CRITICAL"
        }
    """
    return _default_engine.fuse(
        spoof_probability=spoof_probability,
        speaker_similarity=speaker_similarity,
        prosodic_anomaly=prosodic_anomaly,
        phonetic_evidence=phonetic_evidence,
        context_risk=context_risk,
    )


def calculate_risk(ml_result: MLResult) -> RiskResult:
    """
    Convenience function: process an MLResult and produce a full RiskResult.
    Used by ws_audio.py to maintain streaming telemetry over WebSocket.
    """
    return _default_engine.calculate_risk(ml_result)
