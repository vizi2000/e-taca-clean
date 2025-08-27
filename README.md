# E-Taca (Clean Version)

This is a cleaned-up version of the E-Taca project, containing only the essential code and configuration for deployment.

## Structure

-   `/src`: .NET backend source code.
-   `/frontend`: Next.js frontend application.
-   `docker-compose.yml`: Docker configuration for running the application.
-   `.env.example`: Example environment variables. Copy to `.env` and fill in the values.

## Getting Started

1.  **Configure Environment:**
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your database credentials and other settings.

2.  **Build and Run with Docker:**
    ```bash
    docker-compose up --build
    ```

This will build the backend and frontend containers and start the application.
