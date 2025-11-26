git clone https://github.com/yourname/omdb-movie-explorer.git
### 📽️ OMDb Movie Explorer

A full-stack movie search application using React and Spring Boot with Caffeine Cache. Search movies, view details, and manage favorites with a fast, cached backend.

## 🚀 Features

- **Movie Search:** Search movies/series using the public OMDb API with debounced input and infinite scrolling.
- **Favorites Management:** Add/remove favorites, star toggle, backend-backed favorites, bulk deletion, and expandable favorites accordion.
- **Movie Detail Panel:** Smooth slide-in panel with full details (plot, genre, actors, runtime) and favorite toggles.
- **Performance Optimizations:** Caffeine cache for search and movie-detail responses to reduce external calls and speed up repeated lookups.
- **Production Build:** Frontend build served by Spring Boot from `src/main/resources/static`.

## 🛠️ Tech Stack

- **Frontend:** React (Hooks + functional components), custom hooks, vanilla CSS, toast notifications, infinite scroll, responsive layout.
- **Backend:** Spring Boot 3+, WebFlux + WebClient, Caffeine Cache, H2 (in-memory), REST API endpoints, Lombok (optional).

## 📁 Folder Structure

```
omdb-movie-explorer/
├── client/                 # React Frontend
│   ├── src/
│   ├── public/
│   └── dist/               # Build output (copied to backend)
├── src/main/java/com/hitansh/omdb/
│   ├── controller/
│   ├── service/
│   ├── config/             # Caffeine `CacheConfig.java`
│   ├── dto/
│   ├── exception/
│   ├── model/              # domain models
│   ├── repository/
│   └── OmdbMovieExplorerApplication.java
└── src/main/resources/
    ├── application.properties
    └── static/             # React UI build placed here
```

## ⚙️ Running the Project (Development)

1. Clone the repository:

```pwsh
git clone https://github.com/yourname/omdb-movie-explorer.git
cd omdb-movie-explorer
```

2. Setup the backend: add your OMDb API key to `application.properties`:

```properties
omdb.api.key=${OMDB_API_KEY}
spring.main.web-application-type=reactive
```

3. Set the environment variable:

```pwsh
# Windows PowerShell
setx OMDB_API_KEY "your_key_here"
```

Or on macOS/Linux:

```bash
export OMDB_API_KEY="your_key_here"
```

4. Start the backend (project root):

```pwsh
mvn -DskipTests spring-boot:run
```

The backend will run at `http://localhost:8080`.

### Frontend (Development)

To run the React dev server with hot reload:

```pwsh
cd client
npm install
npm run dev
```

The dev server runs at `http://localhost:5173`.

### Build React for Production and Serve with Spring Boot

From the `client/` directory:

```pwsh
npm run build
```

Copy the generated `dist/` contents into Spring Boot's static folder.

On Windows PowerShell:

```pwsh
Remove-Item ..\\src\\main\\resources\\static\\* -Recurse -Force
Copy-Item dist\\* ..\\src\\main\\resources\\static\\ -Recurse
```

Then run Spring Boot again:

```pwsh
mvn -DskipTests spring-boot:run
```

Visit the app at `http://localhost:8080`.

## 🧠 Caffeine Cache — Explanation

Search requests are cached with a key pattern:

```
search::<title>::<page>::<type>
```

Movie detail requests use:

```
movie::<imdbID>
```

Example cache configuration (`src/main/java/com/hitansh/omdb/config/CacheConfig.java`):

```java
@Bean
public Cache<String, String> caffeineCache() {
    return Caffeine.newBuilder()
            .maximumSize(10000)
            .expireAfterWrite(Duration.ofMinutes(30))
            .recordStats()
            .build();
}
```

When a cached result is used, logs may show:

```
Cache HIT for key=movie::tt0465494
```

When there's a cache miss, the app will call the OMDb API with the appropriate query.

## 🔗 API Endpoints

- **Search Movies:** `GET /api/search?s={query}&page=1&type=movie`
- **Movie Details:** `GET /api/movie/{imdbID}`
- **Favorites:**
  - `GET /api/favorites`
  - `POST /api/favorites/{imdbID}`
  - `DELETE /api/favorites/{imdbID}`

## 🧹 Build Commands (Full Project)

```pwsh
mvn clean package -DskipTests
java -jar target/omdb-movie-explorer-0.0.1-SNAPSHOT.jar
```

## 📸 Screenshots (optional)

Add screenshots under `docs/screenshots/`, for example:

- `docs/screenshots/search.png`
- `docs/screenshots/detail-panel.png`
- `docs/screenshots/favorites.png`

## 📦 Deployment Steps (Production)

1. Build the React app (`client/`): `npm run build`.
2. Copy `dist/` → `src/main/resources/static/`.
3. Run the Spring Boot JAR.

---