const History = require('../models/History');

// Save new call history
exports.saveHistory = async (req, res) => {
  try {
    const { speakerName, spoofScore, prosodyScore, speakerScore, contextScore, verdict } = req.body;
    
    const newHistory = new History({
      speakerName,
      spoofScore,
      prosodyScore,
      speakerScore,
      contextScore,
      verdict
    });

    await newHistory.save();
    res.status(201).json({ message: 'History saved successfully', data: newHistory });
  } catch (error) {
    console.error('Error saving history:', error);
    res.status(500).json({ error: 'Server error saving history' });
  }
};

// Get all call histories
exports.getHistories = async (req, res) => {
  try {
    const histories = await History.find().sort({ timestamp: -1 }).limit(50);
    res.status(200).json(histories);
  } catch (error) {
    console.error('Error fetching histories:', error);
    res.status(500).json({ error: 'Server error fetching histories' });
  }
};
