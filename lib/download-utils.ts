export interface DownloadOptions {
  query: string
  answer: string
  sources: Array<{ title: string; url: string; snippet: string }>
  timestamp: string
}

export const downloadAsPDF = (data: DownloadOptions) => {
  // Create a properly formatted HTML content without markdown syntax
  const formatAnswerForPDF = (answer: string) => {
    return answer
      .replace(/\[(\d+)\]/g, '[$1]') // Keep citations as simple [1] format
      .replace(/^#{6}\s+(.+)$/gm, '<h6>$1</h6>') // Convert h6 headers
      .replace(/^#{5}\s+(.+)$/gm, '<h5>$1</h5>') // Convert h5 headers
      .replace(/^#{4}\s+(.+)$/gm, '<h4>$1</h4>') // Convert h4 headers
      .replace(/^#{3}\s+(.+)$/gm, '<h3>$1</h3>') // Convert h3 headers
      .replace(/^#{2}\s+(.+)$/gm, '<h2>$1</h2>') // Convert h2 headers
      .replace(/^#{1}\s+(.+)$/gm, '<h1>$1</h1>') // Convert h1 headers
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic text
      .replace(/`(.*?)`/g, '<code>$1</code>') // Inline code
      .replace(/```[\s\S]*?```/g, (match) => {
        const code = match.replace(/```(\w+)?\n?/, '').replace(/```$/, '')
        return `<pre style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap;"><code>${code}</code></pre>`
      }) // Code blocks
      .replace(/^\* (.+)$/gm, '<li>$1</li>') // List items
      .replace(/^(\d+)\. (.+)$/gm, '<li>$1. $2</li>') // Numbered list items
      .replace(/(<li>.*<\/li>)/g, '<ul>$1</ul>') // Wrap list items in ul
      .replace(/\n\n/g, '</p><p>') // Paragraphs
      .replace(/\n/g, '<br>') // Line breaks
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>AI Search Result - ${data.query}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          color: #333;
        }
        .header {
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .query {
          font-size: 24px;
          font-weight: bold;
          color: #1f2937;
          margin: 0 0 10px 0;
        }
        .timestamp {
          color: #6b7280;
          font-size: 14px;
        }
        .answer {
          margin-bottom: 40px;
          font-size: 16px;
        }
        .answer p {
          margin-bottom: 15px;
        }
        .sources {
          border-top: 1px solid #e5e7eb;
          padding-top: 30px;
        }
        .sources-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #1f2937;
        }
        .source {
          margin-bottom: 20px;
          padding: 15px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          background-color: #f9fafb;
        }
        .source-title {
          font-weight: bold;
          margin-bottom: 5px;
          color: #1f2937;
        }
        .source-url {
          color: #3b82f6;
          font-size: 14px;
          margin-bottom: 8px;
          word-break: break-all;
        }
        .source-snippet {
          color: #4b5563;
          font-size: 14px;
        }
        h2 {
          color: #1f2937;
          margin: 25px 0 15px 0;
          font-size: 20px;
        }
        strong {
          color: #1f2937;
        }
        code {
          background-color: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        }
        @media print {
          body { margin: 0; padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="query">${data.query}</div>
        <div class="timestamp">Generated on ${new Date(data.timestamp).toLocaleDateString()} at ${new Date(data.timestamp).toLocaleTimeString()}</div>
      </div>

      <div class="answer">
        ${formatAnswerForPDF(data.answer)}
      </div>

      <div class="sources">
        <div class="sources-title">Sources (${data.sources.length})</div>
        ${data.sources.map((source, index) => `
          <div class="source">
            <div class="source-title">[${index + 1}] ${source.title}</div>
            <div class="source-url">${source.url}</div>
            <div class="source-snippet">${source.snippet}</div>
          </div>
        `).join('')}
      </div>
      <script>window.print();</script>
    </body>
    </html>
  `

  const newWindow = window.open('', '_blank')
  if (newWindow) {
    newWindow.document.write(htmlContent)
    newWindow.document.close()
  }
}

export const downloadAsMarkdown = (data: DownloadOptions) => {
  let content = `# AI Search Results\n\n`
  content += `**Query:** ${data.query}\n\n`
  content += `## Answer\n\n${data.answer}\n\n`

  if (data.sources.length > 0) {
    content += `## Sources\n\n`
    data.sources.forEach((source, index) => {
      content += `${index + 1}. **[${source.title}](${source.url})**\n`
      content += `   ${source.snippet}\n\n`
    })
  }

  content += `---\n*Generated on: ${new Date(data.timestamp).toLocaleString()}*`

  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `search-result-${Date.now()}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const downloadAsDocx = async (data: DownloadOptions) => {
  // For DOCX, we'll use a simple HTML-to-DOCX approach
  // In a real implementation, you'd use a library like docx or mammoth
  const htmlContent = `
    <html>
      <head><title>AI Search Results</title></head>
      <body>
        <h1>AI Search Results</h1>
        <p><strong>Query:</strong> ${data.query}</p>
        <h2>Answer</h2>
        <div>${data.answer.replace(/\n/g, '<br>')}</div>
        <h2>Sources</h2>
        <ol>
          ${data.sources.map(source => `
            <li>
              <strong><a href="${source.url}">${source.title}</a></strong><br>
              ${source.snippet}
            </li>
          `).join('')}
        </ol>
        <hr>
        <p><em>Generated on: ${new Date(data.timestamp).toLocaleString()}</em></p>
      </body>
    </html>
  `

  const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `search-result-${Date.now()}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export const downloadAsText = (data: DownloadOptions) => {
  let content = `AI Search Results\n\n`
  content += `Query: ${data.query}\n\n`
  content += `Answer:\n${data.answer}\n\n`

  if (data.sources.length > 0) {
    content += `Sources:\n`
    data.sources.forEach((source, index) => {
      content += `${index + 1}. ${source.title}\n`
      content += `   ${source.url}\n`
      content += `   ${source.snippet}\n\n`
    })
  }

  content += `Generated on: ${new Date(data.timestamp).toLocaleString()}`

  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `search-result-${Date.now()}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
