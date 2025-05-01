# AWS U-Turn Hiring

A modern, full-stack hiring platform built with SvelteKit 2.0 and AWS services, designed to streamline the recruitment process from job posting to candidate hiring.

## 🚀 Features

### Authentication & Authorization
- Secure user authentication with AWS Amplify
- Role-based access control
- Persistent session management
- Secure credential handling

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
- Bootstrap 5.3.3
- Bootstrap Icons 1.11.3

### Backend & Infrastructure
- AWS Amplify for authentication and deployment
- AWS Lambda for serverless functions
- AWS DynamoDB for data storage
- AWS S3 for file storage
- AWS SDK v3 for AWS service integration

## 📋 Prerequisites

- Node.js 18 or higher
- AWS account with appropriate permissions
- AWS CLI configured with credentials
- AWS Amplify CLI installed and configured
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

3. Configure AWS Amplify:
   ```bash
   amplify init
   amplify add auth
   amplify push
   ```

4. Configure environment variables:
   Create a `.env` file in the project root:
   ```
   VITE_AWS_REGION=your_aws_region
   VITE_USER_POOL_ID=your_user_pool_id
   VITE_USER_POOL_WEB_CLIENT_ID=your_web_client_id
   VITE_IDENTITY_POOL_ID=your_identity_pool_id
   ```

5. Set up DynamoDB tables:
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

## 📚 API Documentation

### Authentication API
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/signin` | POST | User sign in |
| `/api/auth/signout` | POST | User sign out |
| `/api/auth/session` | GET | Get current session |

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
│   ├── auth/           # Authentication logic
│   ├── hiring-process/  # Hiring process logic
│   ├── dynamodb.js     # DynamoDB configuration
│   └── amplify.js      # Amplify configuration
├── routes/
│   ├── api/
│   │   ├── auth/       # Authentication endpoints
│   │   ├── positions/  # Position endpoints
│   │   └── candidates/ # Candidate endpoints
│   ├── tests/          # Testing interface
│   └── +page.svelte    # Main pages
└── app.html            # HTML template
```

## 🔒 Security Considerations

- AWS Amplify authentication
- Environment-specific configuration
- Secure credential handling
- Input validation
- Error handling
- Rate limiting
- CORS configuration
- Session management

