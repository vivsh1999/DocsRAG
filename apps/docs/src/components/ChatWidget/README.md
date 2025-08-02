# Documentation Chat Widget

A floating chat widget for Docusaurus that integrates with the DocsRAG API to provide intelligent documentation assistance.

## Features

- 🎯 **Intelligent Responses**: Powered by the DocsRAG API with PocketFlow integration
- 🎨 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🌙 **Dark Mode Support**: Automatically adapts to Docusaurus theme
- ⚡ **Real-time Chat**: Instant responses with typing indicators
- 🔧 **Configurable**: Easy customization through configuration file
- ♿ **Accessible**: Built with accessibility best practices

## Installation

The chat widget is automatically included in all Docusaurus pages through the custom `Root` theme component.

## Configuration

You can customize the chat widget by modifying `/src/components/ChatWidget/config.ts`:

```typescript
{
  apiUrl: 'http://localhost:3001', // API endpoint
  welcomeMessage: 'Hi! I\'m your documentation assistant...',
  placeholder: 'Ask about the documentation...',
  title: 'Documentation Assistant',
  subtitle: 'Ask me anything about the docs',
  maxRetries: 3,
  retryDelay: 1000,
  enableTypingIndicator: true,
  enableTimestamps: true,
  enableMetadata: true,
  position: 'bottom-right',
  theme: 'auto'
}
```

## Environment Variables

Set these environment variables to configure the API connection:

- `REACT_APP_API_URL`: The URL of your DocsRAG API (defaults to `http://localhost:3001` in development)

## Usage

1. **Starting the API**: Make sure your DocsRAG API is running on port 3001 (or your configured port)
2. **Development**: Run `npm start` in the docs folder
3. **Production**: Build and deploy your Docusaurus site with `npm run build`

## Customization

### Styling

The widget uses CSS modules located in `/src/components/ChatWidget/styles.module.css`. Key CSS custom properties:

- `--ifm-color-primary`: Primary brand color
- `--ifm-color-emphasis-*`: Background and text colors
- `--ifm-background-color`: Main background color

### Positioning

Change the widget position by updating the `position` property in the config:

- `bottom-right` (default)
- `bottom-left`
- `top-right`
- `top-left`

### Hiding on Specific Pages

Edit `/src/theme/Root.tsx` to hide the chat widget on specific pages:

```typescript
const hideOnPaths = ['/admin', '/login']; // Add paths where you don't want the chat
```

## API Integration

The chat widget expects the following API endpoints:

### POST `/query`

Request:
```json
{
  "query": "How do I configure the API?"
}
```

Response:
```json
{
  "response": "To configure the API...",
  "metadata": {
    "approach": "pocketflow",
    "queryAnalysis": {
      "intent": "how-to",
      "confidence": 0.95
    },
    "responseLength": 150,
    "timestamp": "2025-07-31T10:30:00Z"
  }
}
```

### GET `/health`

Health check endpoint to verify API availability.

## Troubleshooting

### Chat Widget Not Appearing

1. Check that the API is running and accessible
2. Verify CORS configuration in the API
3. Check browser console for JavaScript errors

### API Connection Issues

1. Verify the `apiUrl` in the configuration
2. Check network tab in browser dev tools
3. Ensure the API has proper CORS headers

### Styling Issues

1. Check CSS custom properties are properly defined
2. Verify CSS modules are loading correctly
3. Check for conflicting styles in custom.css

## Development

### Local Development

1. Start the API: `cd apps/api && npm run dev`
2. Start Docusaurus: `cd apps/docs && npm start`
3. Open http://localhost:3000

### Building for Production

1. Configure production API URL in environment variables
2. Build the docs: `npm run build`
3. Test with: `npm run serve`

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Contributing

1. Follow the existing code style and patterns
2. Test on multiple devices and browsers
3. Ensure accessibility compliance
4. Update documentation as needed

## License

This chat widget is part of the DocsRAG project and follows the same license terms.
