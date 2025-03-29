# AWS U-Turn Hiring Platform

A modern hiring platform built with SvelteKit and AWS services, designed to streamline the recruitment process.

## Features

- **Position Management**
  - Create, read, update, and delete job positions
  - Track position status and requirements
  - Environment-aware data storage

- **Candidate Management**
  - Track candidates for each position
  - Store candidate details and application status
  - Link candidates to specific positions

- **Testing Interface**
  - Generate test data for development
  - Clean up test data when needed
  - Real-time data view with automatic updates

## Tech Stack

- **Frontend**: SvelteKit 2.0 with Svelte 5
- **Backend**: AWS Lambda (via SvelteKit)
- **Database**: AWS DynamoDB
- **Deployment**: AWS Amplify

## Prerequisites

- Node.js 18 or higher
- AWS account with appropriate permissions
- AWS CLI configured with credentials

## Environment Setup

1. Create a `.env` file in the project root with the following variables:
   ```
   MY_AWS_ACCESS_KEY_ID=your_access_key
   MY_AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

2. Create DynamoDB tables:
   - Development:
     - `uturn-positions-local`
     - `uturn-candidates-local`
   - Production:
     - `uturn-positions`
     - `uturn-candidates`

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Visit `http://localhost:5173` in your browser

## Testing

The project includes a testing interface at `/tests` that allows you to:
- Generate test data for positions and candidates
- View all test data in real-time
- Clean up test data when needed
- Test API endpoints

## API Endpoints

### Positions API
- `GET /api/positions` - List all positions
- `GET /api/positions?id=<id>` - Get a specific position
- `POST /api/positions` - Create a new position
- `PUT /api/positions` - Update a position
- `DELETE /api/positions?id=<id>` - Delete a position

### Candidates API
- `GET /api/candidates` - List all candidates
- `GET /api/candidates?id=<id>` - Get a specific candidate
- `POST /api/candidates` - Create a new candidate
- `PUT /api/candidates` - Update a candidate
- `DELETE /api/candidates?id=<id>` - Delete a candidate

## Project Structure

```
src/
├── lib/
│   └── dynamodb.js      # DynamoDB configuration and operations
├── routes/
│   ├── api/
│   │   ├── positions/   # Positions API endpoints
│   │   └── candidates/  # Candidates API endpoints
│   └── tests/          # Testing interface
└── app.html            # Main HTML template
```

## Best Practices

This project follows several best practices for maintainability and reliability:

- **API Design**: Consistent response formats and error handling
- **State Management**: Svelte 5's reactive state management
- **Error Handling**: Comprehensive error catching and reporting
- **Testing**: Built-in test data generation and cleanup
- **Security**: Environment-aware configuration and secure credential handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.