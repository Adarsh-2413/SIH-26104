import unittest
from app.services.risk_engine import (
    BaseRiskFusionEngine,
    HeuristicWeightedFusionEngine,
    RiskThresholds,
    RiskWeights,
    fuse_risk,
    calculate_risk,
    get_risk_engine,
    set_risk_engine,
)
from app.models.schemas import FusionOutput, MLResult

class TestRiskFusionEngine(unittest.TestCase):
    def setUp(self):
        # Reset default engine before each test
        self.default_engine = HeuristicWeightedFusionEngine()
        set_risk_engine(self.default_engine)

    def test_output_format_and_keys(self):
        """Verify output dictionary matches exact requested format."""
        result = fuse_risk(
            spoof_probability=0.92,
            speaker_similarity=0.15,
            prosodic_anomaly=0.85,
            phonetic_evidence=0.80,
            context_risk=0.50,
        )
        data = result.model_dump()
        self.assertIn("risk_score", data)
        self.assertIn("risk_level", data)
        self.assertIsInstance(data["risk_score"], int)
        self.assertIsInstance(data["risk_level"], str)
        self.assertEqual(data["risk_level"], "CRITICAL")
        self.assertGreaterEqual(data["risk_score"], 70)

    def test_safe_tier(self):
        """Low spoof, high similarity, low anomaly should yield SAFE."""
        result = fuse_risk(
            spoof_probability=0.05,
            speaker_similarity=0.95,
            prosodic_anomaly=0.10,
            phonetic_evidence=0.05,
            context_risk=0.0,
        )
        self.assertEqual(result.risk_level, "SAFE")
        self.assertLessEqual(result.risk_score, 39)

    def test_suspicious_tier(self):
        """Moderate spoof and mixed metrics should yield SUSPICIOUS."""
        result = fuse_risk(
            spoof_probability=0.45,
            speaker_similarity=0.60,
            prosodic_anomaly=0.40,
            phonetic_evidence=0.30,
            context_risk=0.20,
        )
        self.assertEqual(result.risk_level, "SUSPICIOUS")
        self.assertTrue(40 <= result.risk_score <= 69)

    def test_critical_tier(self):
        """High spoof probability and low similarity should yield CRITICAL."""
        result = fuse_risk(
            spoof_probability=0.88,
            speaker_similarity=0.10,
            prosodic_anomaly=0.75,
            phonetic_evidence=0.80,
            context_risk=0.60,
        )
        self.assertEqual(result.risk_level, "CRITICAL")
        self.assertGreaterEqual(result.risk_score, 70)

    def test_optional_phonetic_evidence_none(self):
        """When phonetic_evidence is None, weights re-normalize seamlessly."""
        res_with = fuse_risk(
            spoof_probability=0.5,
            speaker_similarity=0.5,
            prosodic_anomaly=0.5,
            phonetic_evidence=0.5,
            context_risk=0.5,
        )
        res_none = fuse_risk(
            spoof_probability=0.5,
            speaker_similarity=0.5,
            prosodic_anomaly=0.5,
            phonetic_evidence=None,
            context_risk=0.5,
        )
        self.assertEqual(res_with.risk_score, 50)
        self.assertEqual(res_none.risk_score, 50)

    def test_optional_phonetic_evidence_dict(self):
        """When phonetic_evidence is a dict (e.g. from future ML model), score is extracted."""
        res = fuse_risk(
            spoof_probability=0.7,
            speaker_similarity=0.3,
            prosodic_anomaly=0.6,
            phonetic_evidence={"score": 0.85, "phonemes": ["aa", "b"]},
            context_risk=0.2,
        )
        self.assertIsInstance(res.risk_score, int)
        self.assertIn(res.risk_level, ["SAFE", "SUSPICIOUS", "CRITICAL"])

    def test_configurable_weights(self):
        """Custom weights can be supplied to alter scoring behavior."""
        # Dominant spoof weight (0.90)
        spoof_heavy = RiskWeights(spoof=0.90, speaker=0.05, prosodic=0.03, phonetic=0.01, context=0.01)
        engine = HeuristicWeightedFusionEngine(weights=spoof_heavy)

        res = engine.fuse(
            spoof_probability=1.0,
            speaker_similarity=1.0,
            prosodic_anomaly=0.0,
            phonetic_evidence=0.0,
            context_risk=0.0,
        )
        # Even with perfect speaker match, 0.90 * 1.0 = ~90 score -> CRITICAL
        self.assertEqual(res.risk_score, 90)
        self.assertEqual(res.risk_level, "CRITICAL")

    def test_configurable_thresholds(self):
        """Custom thresholds can be configured."""
        # Ultra-strict: anything > 20 is SUSPICIOUS, > 50 is CRITICAL
        strict_thresholds = RiskThresholds(safe_max=20, suspicious_max=50)
        engine = HeuristicWeightedFusionEngine(thresholds=strict_thresholds)

        res = engine.fuse(
            spoof_probability=0.30,
            speaker_similarity=0.80,
            prosodic_anomaly=0.10,
            phonetic_evidence=0.10,
            context_risk=0.0,
        )
        # Score ~ 23 -> normally SAFE (<=39), but under strict threshold -> SUSPICIOUS
        self.assertTrue(res.risk_score > 20)
        self.assertEqual(res.risk_level, "SUSPICIOUS")

    def test_engine_replaceability(self):
        """Demonstrate that BaseRiskFusionEngine can be replaced with a calibrated model."""
        class CalibratedMLFusionEngine(BaseRiskFusionEngine):
            """Simulates a future Logistic Regression / GBDT calibrated model."""
            def fuse(self, spoof_probability, speaker_similarity, prosodic_anomaly, phonetic_evidence=None, context_risk=0.0):
                # Calibrated non-linear decision boundary example
                sim_factor = 1.0 - speaker_similarity
                logit = (spoof_probability * 3.0) + (sim_factor * 2.0) - 2.5
                prob = 1.0 / (1.0 + (2.71828 ** (-logit)))
                score = int(round(prob * 100))
                level = "SAFE" if score <= 39 else "SUSPICIOUS" if score <= 69 else "CRITICAL"
                return FusionOutput(risk_score=score, risk_level=level)

            def calculate_risk(self, ml_result: MLResult):
                out = self.fuse(ml_result.spoof_probability, ml_result.speaker_similarity, ml_result.prosodic_anomaly, ml_result.phonetic_evidence, ml_result.context_risk)
                return out

        # Swap default engine
        calibrated = CalibratedMLFusionEngine()
        set_risk_engine(calibrated)
        self.assertIs(get_risk_engine(), calibrated)

        # Calls to fuse_risk() now use the calibrated engine
        out = fuse_risk(0.9, 0.1, 0.5)
        self.assertEqual(out.risk_level, "CRITICAL")

    def test_calculate_risk_adapter(self):
        """calculate_risk returns full RiskResult telemetry object."""
        ml = MLResult(
            spoof_probability=0.82,
            speaker_similarity=0.25,
            prosodic_anomaly=0.60,
            phonetic_evidence=0.70,
            context_risk=0.15,
        )
        res = calculate_risk(ml)
        self.assertEqual(res.spoof_probability, 0.82)
        self.assertEqual(res.speaker_similarity, 0.25)
        self.assertGreaterEqual(res.risk_score, 65)

if __name__ == "__main__":
    unittest.main()
