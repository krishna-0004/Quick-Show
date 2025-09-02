import { Movie } from "../models/Movie.mjs";
import { uploadImageFromUrl, deleteImage } from "../config/cloudinary.mjs";
import { getRedis } from "../config/redis.mjs";

// Add movies
export const addMovie = async (req, res) => {
  try {
    const { title, description, language, genre, duration, releaseDate, trailerUrl, posterUrl, status, bookingStatus } = req.body;

    if (!posterUrl) {
      return res.status(400).json({ message: "Poster URL is required" });
    }

    const poster = await uploadImageFromUrl(posterUrl, "movies");

    const movie = await Movie.create({
      title,
      description,
      language,
      genre,
      duration,
      releaseDate,
      trailerUrl,
      poster,
      status,
      bookingStatus,
    });

    // ✅ Invalidate movie caches
    const redis = getRedis();
    await redis.keys("movies:*").then(keys => {
      if (keys.length) redis.del(...keys);
    });

    res.status(201).json({ success: true, movie });
  } catch (err) {
    console.error("Add movie error: ", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateMovie = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, language, genre, duration, releaseDate, trailerUrl, posterUrl, status, bookingStatus } = req.body;

    const movie = await Movie.findById(id);
    if (!movie) return res.status(404).json({ message: "Movie not found" });

    // ✅ If poster URL changed, delete old image from Cloudinary
    if (posterUrl && posterUrl !== movie.poster.url) {
      await deleteImage(movie.poster.public_id);
      const newPoster = await uploadImageFromUrl(posterUrl, "movies");
      movie.poster = newPoster;
    }

    if (title) movie.title = title;
    if (description) movie.description = description;
    if (language) movie.language = language;
    if (genre) movie.genre = Array.isArray(genre) ? genre : [genre];
    if (duration) movie.duration = duration;
    if (releaseDate) movie.releaseDate = releaseDate;
    if (trailerUrl) movie.trailerUrl = trailerUrl;
    if (status) movie.status = status;
    if (bookingStatus) movie.bookingStatus = bookingStatus;

    await movie.save();

    // ✅ Invalidate cache
    const redis = getRedis();
    await redis.del(`movie:${id}`);
    await redis.keys("movies:*").then(keys => {
      if (keys.length) redis.del(...keys);
    });

    res.json({ success: true, movie });
  } catch (err) {
    console.error("Update Movie Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteMovie = async (req, res) => {
  try {
    const { id } = req.params;

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ message: "Movie not found" });
    }

    if (movie.poster && movie.poster.public_id) {
      await deleteImage(movie.poster.public_id);
    }

    await movie.deleteOne();

    // ✅ Invalidate cache
    const redis = getRedis();
    await redis.del(`movie:${id}`);
    await redis.keys("movies:*").then(keys => {
      if (keys.length) redis.del(...keys);
    });

    res.json({ success: true, message: "Movie deleted successfully" });
  } catch (err) {
    console.error("Delete Movie Error: ", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMovies = async (req, res) => {
  try {
    const redis = getRedis();
    const cacheKey = `movies:${JSON.stringify(req.query)}`;

    // ✅ 1. Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // ✅ 2. Fetch from DB
    const { bookingStatus, status, language, genre, q } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (bookingStatus) filter.bookingStatus = bookingStatus;
    if (language) filter.language = language;
    if (genre) filter.genre = genre;
    if (q) filter.$text = { $search: q };

    const movies = await Movie.find(filter).sort({ releaseDate: -1 });

    const response = { success: true, count: movies.length, movies };

    // ✅ 3. Save to Redis (5 min)
    await redis.set(cacheKey, JSON.stringify(response), "EX", 300);

    res.json(response);
  } catch (err) {
    console.error("Get Movies Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    const redis = getRedis();
    const cacheKey = `movie:${id}`;

    // ✅ 1. Check cache
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    // ✅ 2. Fetch from DB
    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const response = { success: true, movie };

    // ✅ 3. Cache result (10 min)
    await redis.set(cacheKey, JSON.stringify(response), "EX", 600);

    res.json(response);
  } catch (err) {
    console.error("Get Movie By ID Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
