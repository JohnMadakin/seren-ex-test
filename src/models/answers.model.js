const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema(
  {
    question: {
      type: mongoose.SchemaTypes.String,
    },
    answer: {
      type: mongoose.SchemaTypes.Mixed,
    },
  },
  { _id: false }
);

const AnswersSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.SchemaTypes.String,
    },
    questions: [QuestionSchema],
    open_conversation: { type: mongoose.SchemaTypes.Boolean, default: false },
  },
  { timestamps: true }
);

const Answers = mongoose.model('Answer', AnswersSchema);

module.exports = { Answers };
