import mongoose from 'mongoose';

const CounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true }, // e.g. "PID_ELE", "PID_SNK", etc.
    seq: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models.Counter) {
  delete mongoose.models.Counter;
}

export default mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
