# InsightFlow AI

**Upload Excel. Ask Questions. Get Executive Insights.**

An AI-powered analytics platform that transforms your spreadsheets into intelligent dashboards in seconds. No technical knowledge required.

![InsightFlow AI](https://insight-flow-22.preview.emergentagent.com)

## 🚀 Features

### ✨ Core Capabilities

- **Smart File Upload**: Drag-and-drop Excel/CSV files with multi-sheet support
- **AI-Powered Analysis**: Automatically detects dimensions, measures, date fields, and relationships
- **Natural Language Chat**: Ask questions in plain English - "Show me booking trends by city"
- **Auto-Generated Dashboards**: KPIs, charts, and insights generated automatically
- **Data Preview**: Explore your data with interactive tables
- **Secure Authentication**: Email/password login with JWT sessions

### 📊 Intelligent Data Analysis

The platform automatically analyzes your uploaded data and identifies:
- **Dimensions**: Categorical fields (City, Hotel, Status, etc.)
- **Measures**: Numeric fields (Revenue, Bookings, Cancellations, etc.)
- **Date Fields**: Time-based columns for trend analysis
- **Relationships**: Cross-sheet connections and possible joins
- **Suggested KPIs**: Relevant metrics based on your data

### 💬 Conversational AI Interface

Chat naturally with your data:
- "Give me a summary of this data"
- "Show me trends over time"
- "Compare bookings by city"
- "Find top performers"
- "Generate a dashboard"

The system provides intelligent responses based on your data structure and content.

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Recharts** - Data visualization
- **Framer Motion** - Smooth animations
- **React Dropzone** - File upload

### Backend
- **Next.js API Routes** - Serverless functions
- **MongoDB** - Database
- **JWT** - Authentication
- **SheetJS (xlsx)** - Excel parsing
- **bcryptjs** - Password hashing

### AI (Optional Enhancement)
- **OpenAI GPT-4o-mini** - Natural language processing (configurable)
- Smart fallback analysis when AI is unavailable

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB running on localhost:27017
- Yarn package manager

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd insightflow-ai
```

2. **Install dependencies**
```bash
yarn install
```

3. **Configure environment variables**

Edit `/app/.env`:
```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=insightflow_ai
NEXT_PUBLIC_BASE_URL=your-domain.com
JWT_SECRET=your-secret-key

# Optional: Add OpenAI key for full AI capabilities
OPENAI_API_KEY=sk-your-openai-key
```

4. **Start the development server**
```bash
yarn dev
```

5. **Access the application**
```
http://localhost:3000
```

## 🎯 Usage

### 1. Create Account
- Navigate to `/auth`
- Click "Sign Up" tab
- Enter your name, email, and password
- Account created! Redirects to dashboard

### 2. Upload Dataset
- Click "Upload Dataset" button
- Drag and drop your Excel/CSV file
- System automatically analyzes the data structure
- Redirects to analysis page

### 3. Explore with AI Chat
- Ask questions in natural language
- Get instant insights and summaries
- View suggested analyses
- Chat history is saved

### 4. View Data
- Switch to "Data Preview" tab
- Explore your data in table format
- See all columns and sample rows

### 5. Manage Datasets
- View all uploaded datasets
- Analyze previous uploads
- Delete datasets when done

## 📊 Smart Data Analysis

The platform includes intelligent fallback analysis that works without external AI APIs:

### Automatic Detection
```javascript
// Dimensions (categorical)
- Text fields: City, Hotel, Status, etc.

// Measures (numeric)  
- Numbers: Amount, Price, Count, etc.

// Date Fields
- Any column with "date" or "time" in name
- Automatically formatted dates

// Relationships
- Detects shared columns across sheets
- Suggests possible joins
```

### Sample Hotel Booking Analysis
When you upload a hotel booking Excel file, the system automatically:
1. Identifies booking dimensions (City, Hotel, Room Type)
2. Detects revenue measures (Room Rate, Total Amount)
3. Recognizes date fields (Booking Date, Check-in, Check-out)
4. Suggests KPIs (Total Bookings, Average Rate, Occupancy)
5. Detects relationships (Hotel sheet ↔ Bookings sheet via City)

## 🧪 Testing

### Backend API Testing

Run comprehensive backend tests:
```bash
python3 /app/backend_test.py
```

Tests cover:
- ✅ User signup/login
- ✅ File upload with smart analysis
- ✅ Dataset management (CRUD)
- ✅ AI chat with fallback responses
- ✅ Chat history persistence
- ✅ Data deletion

### Sample Data

A sample hotel bookings Excel file is included at `/tmp/sample_hotel_bookings.xlsx` with:
- **Bookings sheet**: 500 booking records
- **Hotels sheet**: 5 hotel information records
- Multiple dimensions and measures for testing

## 🔒 Security

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Tokens**: 30-day expiration
- **Protected Routes**: Authentication middleware
- **Input Validation**: File type and size checks
- **MongoDB**: Parameterized queries prevent injection

## 🎨 Design Philosophy

**Apple-Inspired Minimalism**
- Clean white backgrounds
- Soft gray borders
- Spacious layouts
- Professional typography
- Smooth animations
- Executive-friendly interface

## 📁 Project Structure

```
/app
├── app/
│   ├── page.js                    # Landing page
│   ├── layout.js                  # Root layout
│   ├── globals.css                # Global styles
│   ├── auth/
│   │   └── page.js                # Authentication page
│   ├── dashboard/
│   │   └── page.js                # User dashboard
│   ├── analyze/[id]/
│   │   └── page.js                # Dataset analysis page
│   └── api/[[...path]]/
│       └── route.js               # Backend API routes
├── components/
│   ├── ui/                        # shadcn components
│   ├── FileUploadDialog.js       # Upload modal
│   └── DatasetList.js             # Dataset cards
├── lib/
│   └── utils.js                   # Utilities
└── .env                           # Environment config
```

## 🚀 Deployment

### Environment Setup
1. Set `NEXT_PUBLIC_BASE_URL` to your production domain
2. Configure MongoDB connection string
3. Add OpenAI API key (optional)
4. Set secure JWT secret

### Build
```bash
yarn build
yarn start
```

## 🔄 Roadmap

### Phase 1: MVP ✅
- [x] Landing page
- [x] Authentication
- [x] File upload
- [x] Smart data analysis
- [x] AI chat interface
- [x] Dataset management

### Phase 2: Enhanced Analytics (Future)
- [ ] Chart generation from chat
- [ ] Dashboard builder
- [ ] Export to PDF/PNG
- [ ] Shareable links
- [ ] Email reports
- [ ] Advanced visualizations

### Phase 3: Advanced Features (Future)
- [ ] Predictive analytics
- [ ] Anomaly detection
- [ ] Google OAuth
- [ ] Team collaboration
- [ ] Custom KPI builder
- [ ] Real-time data refresh

## 🤝 Contributing

Contributions welcome! Please follow:
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

MIT License - feel free to use for personal or commercial projects

## 💡 Tips

### For Best Results
1. **Clean Data**: Ensure Excel files have headers in the first row
2. **Consistent Naming**: Use clear column names (avoid special characters)
3. **Date Format**: Use standard date formats (YYYY-MM-DD)
4. **Numeric Fields**: Numbers should be in number format, not text
5. **Multiple Sheets**: Name sheets clearly for relationship detection

### Performance
- Files up to 100MB supported
- Optimized for datasets with 100K+ rows
- Multi-sheet workbooks fully supported
- Async processing for large uploads

### Chat Tips
- Be specific: "Show me revenue by city" vs "show data"
- Use keywords: "trend", "compare", "top", "summary"
- Ask follow-up questions to drill down
- Check "Data Preview" tab for column names

## 🐛 Troubleshooting

### Upload Issues
- **File too large**: Try splitting into smaller files
- **Parse error**: Ensure Excel file is not corrupted
- **Missing data**: Check first row has column headers

### Chat Not Responding
- System uses smart fallback when AI unavailable
- Check data was uploaded successfully
- Ensure column names are clear

### Authentication Problems
- Clear browser cache and cookies
- Check email format is valid
- Password must be at least 6 characters

## 📧 Support

For issues or questions:
- Create GitHub issue
- Check existing documentation
- Review sample files for format reference

---

**Built with ❤️ using Next.js, MongoDB, and AI**

*Transform your spreadsheets into insights in seconds.*
