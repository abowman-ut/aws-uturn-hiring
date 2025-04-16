# AWS U-Turn Hiring

A modern, full-stack hiring platform built with SvelteKit 2.0 and AWS services, designed to streamline the recruitment process from job posting to candidate hiring.

## 🚀 Features

### Position Management
- Create and manage job positions with detailed requirements
- Track position status (Open, On Hold, Cancelled, Filled)
- Set hiring timelines and salary ranges
- Department-based organization
- Real-time position status updates

### Candidate Management
- Comprehensive candidate tracking system
- Multi-stage hiring process (CV Review, Culture Fit, Interview, Decision)
- Detailed candidate profiles with resume management
- Automated stage progression
- Decision tracking with notes and decision makers
- Hiring timeline visualization

### Analytics Dashboard
- Real-time hiring metrics
- Department-wise position distribution
- Candidate pipeline visualization
- Average time-to-hire tracking
- Interactive charts and statistics

### Testing Interface
- Generate realistic test data
- Real-time data visualization
- API endpoint testing
- Data cleanup capabilities

## 🛠 Tech Stack

### Frontend
- SvelteKit 2.0
- Svelte 5 with Runes
- Chart.js for data visualization
- Bootstrap CSS, JS, Icons

### Backend
- AWS Lambda
- AWS DynamoDB
- AWS Amplify for deployment

## 📋 Prerequisites

- Node.js 18 or higher
- AWS account with appropriate permissions
- AWS CLI configured with credentials
- Understanding of SvelteKit and AWS services

## ⚙️ Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/aws-uturn-hiring.git
   cd aws-uturn-hiring
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the project root:
   ```
   MY_AWS_ACCESS_KEY_ID=your_access_key
   MY_AWS_SECRET_ACCESS_KEY=your_secret_key
   ```

4. Set up DynamoDB tables:
   - Development:
     ```bash
     aws dynamodb create-table --table-name uturn-positions-local --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
     aws dynamodb create-table --table-name uturn-candidates-local --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5
     ```
   - Production:
     ```bash
     aws dynamodb create-table --table-name uturn-positions --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10
     aws dynamodb create-table --table-name uturn-candidates --attribute-definitions AttributeName=id,AttributeType=S --key-schema AttributeName=id,KeyType=HASH --provisioned-throughput ReadCapacityUnits=10,WriteCapacityUnits=10
     ```

## 🚀 Development

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

3. Access the testing interface at:
   ```
   http://localhost:5173/tests
   ```

## 📚 API Documentation

### Positions API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/positions` | GET | List all positions |
| `/api/positions?id=<id>` | GET | Get specific position |
| `/api/positions` | POST | Create new position |
| `/api/positions` | PUT | Update position |
| `/api/positions?id=<id>` | DELETE | Delete position |

### Candidates API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/candidates` | GET | List all candidates |
| `/api/candidates?id=<id>` | GET | Get specific candidate |
| `/api/candidates` | POST | Create new candidate |
| `/api/candidates` | PUT | Update candidate |
| `/api/candidates?id=<id>` | DELETE | Delete candidate |

## 📁 Project Structure

```
src/
├── lib/
│   ├── components/      # Reusable UI components
│   ├── hiring-process/  # Hiring process logic
│   └── dynamodb.js      # DynamoDB configuration
├── routes/
│   ├── api/
│   │   ├── positions/   # Position endpoints
│   │   └── candidates/  # Candidate endpoints
│   ├── tests/          # Testing interface
│   └── +page.svelte    # Main pages
└── app.html            # HTML template
```

## 🔒 Security Considerations

- Environment-specific configuration
- Secure credential handling
- Input validation
- Error handling
- Rate limiting
- CORS configuration

## 🧪 Testing

1. Generate test data:
   ```bash
   npm run test:generate
   ```

2. Run tests:
   ```bash
   npm run test
   ```

3. Clean up test data:
   ```bash
   npm run test:cleanup
   ```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- SvelteKit team for the amazing framework
- AWS for the cloud infrastructure
- All contributors who have helped improve this project

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_region
AWS_TABLE_NAME=your_table_name

# AWS Cognito Configuration
VITE_COGNITO_REGION=your_region
VITE_COGNITO_USER_POOL_ID=your_user_pool_id
VITE_COGNITO_USER_POOL_WEB_CLIENT_ID=your_client_id

# Toggl Configuration
TOGGL_API_TOKEN=your_api_token
TOGGL_WORKSPACE_ID=your_workspace_id

# Azure Configuration
VITE_AZURE_CLIENT_ID=your_client_id
VITE_AZURE_TENANT_ID=your_tenant_id
VITE_REDIRECT_URI=your_redirect_uri
```

### AWS Cognito Setup

1. Create a Cognito User Pool in your AWS account
2. Configure the following settings:
   - App client settings
   - Callback URLs
   - Identity providers
   - Required attributes
   - Password policy
   - MFA settings (if needed)
3. Copy the following values from your Cognito User Pool:
   - Region (e.g., us-east-1)
   - User Pool ID
   - App Client ID