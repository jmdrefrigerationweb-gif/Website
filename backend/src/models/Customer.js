const mongoose = require('mongoose');

// Schema for individual components/parts used during service
const ComponentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
});

// Schema for each service/installation entry on a customer's card
const ServiceEntrySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    type: {
        type: String,
        enum: ['new_installation', 'service'],
        required: true,
    },
    components: [ComponentSchema],
    totalCost: {
        type: Number,
        required: true,
        min: 0,
    },
    notes: {
        type: String,
        trim: true,
        default: '',
    },
    nextServiceAfterMonths: {
        type: Number,
        min: 0,
        default: 0, // 0 means no scheduled next service
    },
});

// Main customer schema
const CustomerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Customer name is required'],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            unique: true,
            trim: true,
            match: [/^\+?[0-9]{10,15}$/, 'Please enter a valid phone number'],
        },
        address: {
            type: String,
            required: [true, 'Address is required'],
            trim: true,
        },
        serviceEntries: [ServiceEntrySchema],
        // Date until which this customer should be ignored on the dashboard
        ignoredUntil: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient querying
CustomerSchema.index({ name: 'text', phone: 'text' }); // text index for search
CustomerSchema.index({ ignoredUntil: 1 });

// Virtual: get the latest service entry
CustomerSchema.virtual('latestEntry').get(function () {
    if (!this.serviceEntries || this.serviceEntries.length === 0) return null;
    return this.serviceEntries[this.serviceEntries.length - 1];
});

// Virtual: calculate next service date
CustomerSchema.virtual('nextServiceDate').get(function () {
    const latest = this.latestEntry;
    if (!latest || !latest.nextServiceAfterMonths) return null;
    const date = new Date(latest.date);
    date.setMonth(date.getMonth() + latest.nextServiceAfterMonths);
    return date;
});

CustomerSchema.set('toJSON', { virtuals: true });
CustomerSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Customer', CustomerSchema);
