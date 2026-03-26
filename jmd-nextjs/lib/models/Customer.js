import mongoose from 'mongoose';

// Schema for individual components/parts used during service
const ComponentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
});

// Schema for each service/installation entry on a customer's card
const ServiceEntrySchema = new mongoose.Schema({
    date: { type: Date, required: true, default: Date.now },
    type: { type: String, enum: ['new_installation', 'service'], required: true },
    components: [ComponentSchema],
    totalCost: { type: Number, required: true, min: 0 },
    notes: { type: String, trim: true, default: '' },
    nextServiceAfterMonths: { type: Number, min: 0, default: 0 },
    source: { type: String, default: 'manual' },
});

// Main customer schema
const CustomerSchema = new mongoose.Schema(
    {
        name: { type: String, required: [true, 'Customer name is required'], trim: true },
        phone: {
            type: String,
            trim: true,
            default: '',
            validate: {
                validator: function(v) {
                    return v === '' || /^\+?[0-9]{10,15}$/.test(v);
                },
                message: 'Please enter a valid phone number'
            }
        },
        address: { type: String, required: [true, 'Address is required'], trim: true },
        normalizedPhone: { type: String, default: '', index: true },
        normalizedAddress: { type: String, default: '', index: true },
        serviceEntries: [ServiceEntrySchema],
        ignoredUntil: { type: Date, default: null },
    },
    { timestamps: true }
);

// Indexes
CustomerSchema.index({ name: 'text', phone: 'text' });
CustomerSchema.index({ ignoredUntil: 1 });

// Virtual: latest service entry
CustomerSchema.virtual('latestEntry').get(function () {
    if (!this.serviceEntries || this.serviceEntries.length === 0) return null;
    return this.serviceEntries[this.serviceEntries.length - 1];
});

// Virtual: next service date
CustomerSchema.virtual('nextServiceDate').get(function () {
    const latest = this.latestEntry;
    if (!latest || !latest.nextServiceAfterMonths) return null;
    const date = new Date(latest.date);
    date.setMonth(date.getMonth() + latest.nextServiceAfterMonths);
    return date;
});

CustomerSchema.set('toJSON', { virtuals: true });
CustomerSchema.set('toObject', { virtuals: true });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
