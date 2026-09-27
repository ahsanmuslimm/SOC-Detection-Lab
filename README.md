# SOC Detection Lab

Enterprise-grade Security Operations Center (SOC) detection and incident response platform.

## Quick Start

```bash
npm install
npm run dev
```

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## Project Structure

```
src/
  ├── backend/          # 67 services (12 domains)
  ├── frontend/         # 28 modules (3 layers)
  └── shared/           # 12 shared utilities

tests/
  ├── unit/             # Unit tests
  ├── integration/      # Integration tests
  └── e2e/              # End-to-end tests

infra/
  ├── kubernetes/       # K8s deployments
  ├── terraform/        # Infrastructure as code
  └── docker/           # Docker configurations

docs/                   # Project documentation
config/                 # Configuration files
scripts/                # Build and utility scripts
```

## Development

- **Language**: TypeScript (strict mode)
- **Testing**: Jest (80%+ coverage required)
- **Linting**: ESLint
- **Formatting**: Prettier

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical details.

## Building

```bash
npm run build        # Build all
npm run test         # Run tests
npm run lint         # Check code quality
npm run format       # Format code
```

## CI/CD

GitHub Actions pipelines configured in `.github/workflows/`

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Development Guide](docs/DEVELOPMENT.md)

## License

MIT
