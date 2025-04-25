# Newsletter Automation

A Node.js-based newsletter automation system that scrapes, processes, and sends email newsletters. This project includes web scraping capabilities, email generation, and automated sending functionality.

## Features

- Web scraping with Puppeteer and Cheerio
- Email processing and generation
- Automated email sending
- Database integration (SQLite and DynamoDB)
- OpenAI integration for content processing
- Winston logging system

## Prerequisites

- Node.js (Latest LTS version recommended)
- npm or yarn
- Docker (optional, for containerized deployment)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/newsletter-automation.git
cd newsletter-automation
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your configuration:
```env
# Add your environment variables here
OPENAI_API_KEY=your_openai_api_key
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

## Project Structure

```
newsletter-automation/
├── src/
│   ├── scrapers/      # Web scraping modules
│   ├── processors/    # Data processing modules
│   ├── classifiers/   # Content classification
│   ├── db.js         # Database operations
│   ├── index.js      # Main application entry
│   ├── emailGenerator.js  # Email content generation
│   └── emailSender.js     # Email sending functionality
├── package.json
└── Dockerfile
```

## Usage

To run the Hacker News digest analyzer:
```bash
npm run analyze-hn
```

## Development

The project uses several key technologies:
- Puppeteer for web scraping
- OpenAI for content processing
- SQLite for local data storage
- DynamoDB for cloud data storage
- Winston for logging
- Nodemailer for email sending

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- OpenAI for AI capabilities
- AWS SDK for DynamoDB integration
- Various open-source libraries used in this project 