# Perplexity Clone

A modern AI-powered search engine built with Next.js 15, React 19, and TypeScript. This application provides comprehensive answers to user queries by combining real-time web search with advanced AI language models.

## Features

- 🔍 **AI-Powered Search**: Utilizes Google Gemini Flash 2.5 for intelligent response generation
- 🌐 **Real-time Web Search**: Integrates with Exa API for semantic web search
- 📱 **Responsive Design**: Modern, mobile-first UI built with Tailwind CSS and shadcn/ui
- ⚡ **Fast Performance**: Built on Next.js 15 with React 19 and Turbopack
- 🎯 **Enhanced Citation Tooltips**: Wider, more compact tooltips with favicon display and quick "Visit" action
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
- 🖼️ **Favicon Integration**: Source tooltips automatically load and display website favicons

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **AI Services**: Google Gemini Flash 2.5
- **Search API**: Exa AI
- **Icons**: Lucide React
- **Package Manager**: Bun
- **Real-time Features**: Streaming responses, animated UI components
- **Download Functionality**: Multi-format export capabilities

## Prerequisites

Before running this application, you'll need to obtain API keys for:

1. **Google AI API Key**: Get it from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **Exa API Key**: Sign up at [Exa AI](https://exa.ai) and get your API key

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
   # AI Services
   GOOGLE_AI_API_KEY=your_gemini_api_key_here
   EXA_API_KEY=your_exa_api_key_here

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
3. **Citation Tooltips**: Hover over citation numbers to see compact source previews with favicons
4. **Source Navigation**: Click on citation tooltips or source cards to visit external links
5. **Download Options**: Use the download dropdown to save responses in multiple formats (PDF, Markdown, Word, Text)
6. **New Chat**: Click the "New Chat" button to start a fresh conversation
7. **Copy & Share**: Easily copy answers to clipboard or share them

## Example Queries

Try asking questions like:
- "What are the latest developments in AI technology?"
- "Explain quantum computing and its practical applications"
- "What are the current trends in cryptocurrency markets?"
- "How do I get started with machine learning?"

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
