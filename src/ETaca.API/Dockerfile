FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["src/ETaca.API/ETaca.API.csproj", "ETaca.API/"]
COPY ["src/ETaca.Domain/ETaca.Domain.csproj", "ETaca.Domain/"]
COPY ["src/ETaca.Application/ETaca.Application.csproj", "ETaca.Application/"]
COPY ["src/ETaca.Infrastructure/ETaca.Infrastructure.csproj", "ETaca.Infrastructure/"]
RUN dotnet restore "ETaca.API/ETaca.API.csproj"
COPY src/ .
WORKDIR "/src/ETaca.API"
RUN dotnet build "ETaca.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "ETaca.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ETaca.API.dll"]