# HealSmart - Setup Guide

## Environment Setup

### Gemini API Key (For AI Appointment Prediction)

The application now includes AI-powered appointment prediction using Google's Gemini API.

#### Steps to get your Gemini API Key:

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Select or create a Google Cloud project
4. Copy the generated API key

#### Adding to your project:

1. Update your `.env` file in the project root:
```env
GEMINI_API_KEY="your-api-key-here"
```

2. Deploy to Supabase (if using cloud):
   - Go to your Supabase project settings
   - Navigate to Configuration > Database > Functions
   - Add the GEMINI_API_KEY as a secret environment variable

### Features with Gemini API:

- **AI Appointment Prediction**: Analyzes your appointment history to predict the next recommended appointment date
- **Auto-Booking**: Automatically books appointments based on AI predictions with high confidence scores
- **Smart Scheduling**: Uses natural language processing to understand appointment patterns

## Appointment Booking  

### How to book an appointment:

1. Navigate to "Book Appointment"
2. Search and select a doctor by specialty or name
3. Choose your preferred date (must be a weekday in the future)
4. Select a time slot (30-minute appointments)
5. Confirm booking

### What to do if appointment booking isn't working:

1. **Check availability**: Ensure the selected date is a weekday and the time slot isn't already booked
2. **Provider verification**: Make sure the doctor is marked as active in the admin panel
3. **Check RLS policies**: Verify Row Level Security policies are correct in Supabase

### Using AI Predictions:

1. Go to your Patient Dashboard
2. Look for "AI Appointment Prediction" card
3. Click "Predict Next Appointment"
4. Review the predicted date and confidence score
5. Click "Auto Book" to automatically create the appointment

## Database Schema

### Appointments Table
- `patient_id`: Foreign key to auth.users
- `provider_id`: Foreign key to providers
- `appointment_date`: Date of appointment
- `start_time`: Start time (TIME format)
- `end_time`: End time (TIME format)
- `status`: pending, confirmed, completed, cancelled, no_show, rescheduled
- `type`: Appointment type (e.g., consultation)

### AI Predictions Table
- `patient_id`: Patient making the prediction request
- `provider_id`: Optional - specific provider
- `prediction_type`: follow_up, no_show_risk, optimal_time, cancellation_risk
- `prediction_data`: JSON data with prediction details
- `confidence_score`: 0-100 confidence level

## Troubleshooting

### Appointment not appearing after booking:
- Check browser console for errors (F12)
- Verify user is logged in correctly
- Clear browser cache and try again
- Check Supabase RLS policies allow the operation

### AI Prediction returns "No appointment history"
- Need at least one past appointment to generate predictions
- Book an appointment first, then try predictions

### Gemini API errors:
- Verify GEMINI_API_KEY is set correctly
- Check API key has appropriate permissions
- Ensure daily API quota hasn't been exceeded
- Check Firebase/Google Cloud project is billed (if applicable)

## Future Enhancements

- Webhook notifications when appointments are predicted
- Calendar sync with Google Calendar and Outlook
- SMS/Email reminders for AI-predicted appointments
- Doctor feedback loop to improve predictions
- Multi-language support for appointment descriptions
