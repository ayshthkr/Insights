# Perplexity Clone

A modern AI-p## Features

- 🔐 **Secure Authentication**: Clerk-powered authentication with sign-in/sign-up modals and custom-styled components
- 👤 **User-Gated Access**: Search functionality restricted to authenticated users with elegant authentication prompts via dialog modalsed search engine built with Next.js 15, React 19, and TypeScript. This application provides comprehensive answers to user queries by combining real-time web search with advanced AI language models and intelligent query classification.

## Recent Improvements

### Authentication & User Management
- 🔐 **Clerk Authentication**: Complete authentication system with clean header design featuring standard SignInButton and custom-styled SignUpButton
- 👤 **User-Gated Search**: Only authenticated users can perform searches, with elegant modal prompts for unauthenticated users
- 🎨 **Enhanced Header**: Clean header layout with proper spacing, authentication buttons positioned on the right, and integrated user profile management
- 📱 **Responsive Auth UI**: Authentication buttons adapt to different screen sizes with proper spacing and hover effects

### UI/UX Enhancements
- 🏷️ **Enhanced Citation Tooltips**: Tooltips now automatically position below if there's insufficient space above
- 🎯 **Smart Search Terms Display**: Beautiful, animated search terms shown during web search with enhanced visual design
- 🔍 **Improved Search Interface**: Search bar shows current question (disabled) during answer generation and clears when complete
- 📝 **Better Markdown Rendering**: Fixed list and heading alignment issues with improved spacing and block-level rendering
- 🌐 **Favicon Prefetching**: Automatic favicon loading for all sources with elegant fallback to globe icon
- 🎨 **Enhanced Copy Button**: Button component with proper hover effects and visual feedback

### Backend Improvements
- 🔄 **Intelligent Feedback Loop**: Backend automatically evaluates search context quality and performs up to 3 search iterations with refined terms if needed
- 🎯 **Smart Context Evaluation**: AI-powered assessment of search result relevance and completeness
- 💬 **Direct Answer Generation**: Responses start directly addressing the question without "Here's a summary..." prefixes
- ⚡ **Adaptive Search Strategy**: Automatically refines search terms based on context quality evaluation
- 🧠 **Enhanced Query Understanding**: Improved classification for determining when web search is needed vs. general knowledge responses

### Technical Improvements
- ⚡ **Hydration Issue Fixes**: Resolved SSR/client rendering mismatches in markdown components
- 🎨 **Enhanced Progress Visualization**: Removed unnecessary "complete" step and improved search term presentation
- 🔧 **Better List Rendering**: Fixed bullet point and content alignment issues in markdown
- 🎪 **Improved Animations**: Smoother transitions and micro-interactions throughout the interface

## Features

- � **Secure Authentication**: Clerk-powered authentication with sign-in/sign-up modals
- 👤 **User-Gated Access**: Search functionality restricted to authenticated users with elegant authentication prompts
- �🔍 **AI-Powered Search**: Utilizes Google Gemini Flash 2.5 for intelligent response generation
- 🧠 **Smart Query Classification**: Automatically determines whether queries need web search or can be answered with general knowledge
- 🔄 **Intelligent Feedback Loop**: Backend evaluates context quality and refines search terms automatically (up to 3 iterations)
- 🎯 **Intelligent Search Terms**: Generates 2-3 optimized search terms for web queries and displays them beautifully to users
- 🌐 **Real-time Web Search**: Integrates with Exa API for semantic web search when needed with automatic refinement
- ⚡ **Optimized Performance**: Avoids unnecessary web searches for simple questions, greetings, and general knowledge queries
- 💬 **Direct Assistant Responses**: AI provides helpful, direct answers without generic prefixes like "Here's a summary..."
- 📱 **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS and shadcn/ui
- ⚡ **Fast Performance**: Built on Next.js 15 with React 19 and Turbopack
- 🎯 **Enhanced Citation Tooltips**: Smart positioning tooltips with favicon display and improved user experience
- 🌙 **Dark Mode**: Automatic dark/light theme support
- 📊 **Compact Source Cards**: Streamlined, clickable source cards with improved hover effects
- 🔄 **Smart Loading States**: Shows active query in disabled input during answer generation
- ⬇️ **Multi-format Downloads**: Download responses as properly formatted PDF, Word, Markdown, or Text files
- 🎨 **Smooth Animations**: Beautiful transitions and micro-interactions throughout the interface
- 📍 **Persistent Query Display**: Input box shows current query during loading with animated shimmer effect
- 📜 **Auto-scroll**: Automatic scrolling during response generation for optimal reading experience
- 🗣️ **Improved Navigation**: New Chat button with proper styling and instant page refresh
- 💬 **Interactive Source Cards**: Click-to-open source cards with enhanced visual feedback
- ✨ **Sparkle Icon**: Clean answer presentation with elegant Sparkle icon (no "Answer" label)
- 🖼️ **Favicon Integration**: Source tooltips automatically load and display website favicons with prefetching

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Authentication**: Clerk
- **Database**: Supabase (with Clerk integration)
- **Styling**: Tailwind CSS, shadcn/ui components, Framer Motion
- **AI Services**: Google Gemini Flash 2.5
- **Search API**: Exa AI
- **Icons**: Lucide React
- **Package Manager**: Bun
- **Real-time Features**: Streaming responses, animated UI components
- **Download Functionality**: Multi-format export capabilities

## Prerequisites

Before running this application, you'll need to obtain API keys for:

1. **Clerk Authentication**: Sign up at [Clerk](https://clerk.com) and create a new application
2. **Google AI API Key**: Get it from [Google AI Studio](https://makersuite.google.com/app/apikey)
3. **Exa API Key**: Sign up at [Exa AI](https://exa.ai) and get your API key
4. **Supabase** (optional): For database functionality with Clerk integration

## Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd per-clone
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables**

   Copy the example environment file and add your API keys:
   ```bash
   cp .env.local.example .env.local
   ```

   Edit `.env.local` and add your API keys:
   ```env
   # Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   # AI Services
   GOOGLE_AI_API_KEY=your_gemini_api_key_here
   EXA_API_KEY=your_exa_api_key_here

   # Database (optional)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Run the development server**
   ```bash
   bun dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

1. **Basic Search**: Type any question in the search box and press Enter
2. **Loading State**: During answer generation, the input shows your query and is disabled with a shimmer effect
3. **Search Terms Display**: When web search is triggered, see beautifully animated search terms being used
4. **Citation Tooltips**: Hover over citation numbers to see smart-positioned source previews with favicons (no visit buttons - tooltips disappear on mouse out)
5. **Source Navigation**: Click on citation numbers to scroll to sources or click source cards to visit external links
6. **Intelligent Feedback Loop**: The backend automatically evaluates search context quality and refines search terms up to 3 times if needed (seamlessly handled without showing iteration count to users)
7. **Copy & Share**: Easily copy answers to clipboard with proper button hover effects or share them
8. **Download Options**: Use the download dropdown to save responses in multiple formats (PDF, Markdown, Word, Text)
9. **New Chat**: Click the "New Chat" button to start a fresh conversation
10. **Improved Rendering**: Experience properly aligned lists, headings, and markdown content without layout issues
11. **Direct AI Responses**: AI answers directly and helpfully without generic summary prefixes

## Example Queries

Try asking questions like:
- "What are the latest developments in AI technology?"
- "Explain quantum computing and its practical applications"
- "What are the current trends in cryptocurrency markets?"
## How It Works

### Intelligent Query Classification

The application uses an advanced query classification system to optimize performance and reduce unnecessary API calls:

1. **Pattern Recognition**: Simple queries (greetings, basic math, definitions) are detected using regex patterns
2. **AI Classification**: Complex queries are analyzed using Google Gemini Flash 2.5 to determine if web search is needed
3. **Smart Fallbacks**: Robust error handling ensures simple queries aren't sent to web search APIs unnecessarily

### Search Flow

1. **Query Analysis**: User query is classified as either requiring web search or answerable with general knowledge
2. **Conditional Search**: Only queries requiring current information trigger web searches via Exa API
3. **Term Generation**: For web searches, 2-3 optimized search terms are generated and displayed to the user
4. **Response Generation**: Comprehensive answers are generated using either web sources or general knowledge
5. **Real-time Updates**: Users see live progress including search terms being used

### Query Types

**Requires Web Search:**
- Current events and news
- Real-time data (stock prices, weather, sports)
- Recent research and discoveries
- Product reviews and pricing
- Current trends and viral content

**Uses General Knowledge:**
- Basic greetings and conversation
- Historical facts and established science
- Mathematical concepts and calculations
- Definitions and explanations
- Programming concepts and tutorials

## Project Structure

```
per-clone/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts          # Search API endpoint
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page component
├── components/
│   └── ui/
│       ├── search-input.tsx      # Search input component
│       ├── search-results.tsx    # Results display component
│       ├── search-loading.tsx    # Loading state component
│       └── search-error.tsx      # Error state component
├── lib/
│   └── utils.ts                  # Utility functions
├── types/
│   └── search.ts                 # TypeScript type definitions
└── package.json
```

## API Endpoints

### POST /api/search

Searches the web and generates AI-powered answers.

**Request Body:**
```json
{
  "query": "Your search query here"
}
```

**Response:**
```json
{
  "query": "Your search query",
  "answer": "AI-generated comprehensive answer",
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com",
      "snippet": "Brief excerpt from the source"
    }
  ],
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_AI_API_KEY` | Google Gemini API key | Yes |
| `EXA_API_KEY` | Exa search API key | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL | No |

### API Rate Limits

- **Google Gemini**: Check your API quotas in Google AI Studio
- **Exa API**: Free tier includes limited requests per month

## Deployment

This application can be deployed to Vercel, Netlify, or any platform that supports Next.js.

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in the Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set the following environment variables in your deployment platform:
- `GOOGLE_AI_API_KEY`
- `EXA_API_KEY`
- `NEXT_PUBLIC_APP_URL` (your production URL)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Google Gemini](https://deepmind.google/technologies/gemini/)
- Web search by [Exa AI](https://exa.ai/)
- Icons by [Lucide](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

---

## Troubleshooting

### Common Issues

1. **"API keys not configured" error**
   - Make sure you've added your API keys to `.env.local`
   - Restart the development server after adding environment variables

2. **Search requests failing**
   - Check that your API keys are valid and active
   - Verify you haven't exceeded API rate limits

3. **Styling issues**
   - Make sure Tailwind CSS is properly configured
   - Clear your browser cache and restart the dev server

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Verify your API keys are correct
3. Ensure all dependencies are installed
4. Try restarting the development server

For additional help, please open an issue in the repository.
