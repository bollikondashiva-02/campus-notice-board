
import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";

import { supabase } from "./lib/supabase";
import NoticeDetails from "./Pages/NoticeDetails";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import AdminDashboard from "./Pages/AdminDashboard";

import "./App.css";

function Home() {
  const [notices, setNotices] = useState([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [user, setUser] = useState(undefined);

  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout Error:", error);
      return;
    }

    setUser(null);
    navigate("/login");
  }

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!currentUser) {
        navigate("/login");
        return;
      }

      setUser(currentUser);
    }

    async function loadNotices() {
      setNoticesLoading(true);

      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Supabase Error:", error);
        setNoticesLoading(false);
        return;
      }

      setNotices(data);
      setNoticesLoading(false);
    }

    loadUser();
    loadNotices();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;

      if (!isMounted) {
        return;
      }

      setUser(currentUser);

      if (!currentUser) {
        navigate("/login");
      }
    });

    const channel = supabase
      .channel("notices-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notices",
        },
        () => {
          loadNotices();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  function getCategoryIcon(category) {
    switch (category) {
      case "Exam":
        return "📝";

      case "Event":
        return "🎉";

      case "Placement":
        return "💼";

      case "General":
        return "📢";

      default:
        return "📌";
    }
  }

  function isNewNotice(createdAt) {
    const noticeDate = new Date(createdAt);
    const currentDate = new Date();

    const difference =
      currentDate.getTime() - noticeDate.getTime();

    const daysDifference =
      difference / (1000 * 60 * 60 * 24);

    return daysDifference >= 0 && daysDifference <= 3;
  }

  /* ================================
     NOTICE SUMMARY COUNTS
  ================================= */

  const totalNotices = notices.length;

  const examNotices = notices.filter(
    (notice) => notice.category === "Exam"
  ).length;

  const eventNotices = notices.filter(
    (notice) => notice.category === "Event"
  ).length;

  const placementNotices = notices.filter(
    (notice) => notice.category === "Placement"
  ).length;

  /* ================================
     FILTERED NOTICES
  ================================= */

  const filteredNotices = notices.filter(
    (notice) =>
      (category === "All" ||
        notice.category === category) &&
      (notice.title
        .toLowerCase()
        .includes(search.toLowerCase()) ||
        notice.description
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        notice.category
          .toLowerCase()
          .includes(search.toLowerCase()))
  );

  /* ================================
     RECENTLY ADDED NOTICES
  ================================= */

  const recentlyAddedNotices =
    filteredNotices.slice(0, 3);

  if (user === undefined) {
    return (
      <div className="auth-loading">
        Checking login...
      </div>
    );
  }

  return (
    <div className="app">

      {/* ================================
          NAVBAR
      ================================= */}

      <nav className="navbar">

        <Link to="/" className="logo">
          Campus Notice Board
        </Link>

        <div className="nav-links">

          <Link to="/">
            🏠 Home
          </Link>

          {user ? (
            <>
              <div className="user-profile">
                <div className="user-avatar">
                  {user.email?.charAt(0).toUpperCase()}
                </div>

                <div className="user-details">
                  <span className="user-role">
                    Student
                  </span>

                  <span className="user-email">
                    {user.email}
                  </span>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="logout-button"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">
                🔐 Login
              </Link>

              <Link to="/signup">
                📝 Signup
              </Link>
            </>
          )}

        </div>

      </nav>

      {/* ================================
          HERO HEADER
      ================================= */}

      <header className="header">

        <h1>
          Campus Notice Board
        </h1>

        <p>
          Stay updated with the latest campus announcements
        </p>

      </header>

      {/* ================================
          NOTICE SECTION
      ================================= */}

      <main className="notice-container">

        {/* Search */}

        <input
          type="text"
          placeholder="Search notices..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          className="search-input"
        />

        {/* Category Filter */}

        <select
          value={category}
          onChange={(e) =>
            setCategory(e.target.value)
          }
          className="category-filter"
        >

          <option value="All">
            All Categories
          </option>

          <option value="General">
            General
          </option>

          <option value="Exam">
            Exam
          </option>

          <option value="Event">
            Event
          </option>

          <option value="Placement">
            Placement
          </option>

        </select>

        {/* ================================
            NOTICE SUMMARY
        ================================= */}

        <div className="student-summary">

          <div className="student-summary-card">

            <div className="summary-icon">
              📢
            </div>

            <div className="summary-info">

              <span className="summary-label">
                Total Notices
              </span>

              <strong>
                {totalNotices}
              </strong>

            </div>

          </div>

          <div className="student-summary-card">

            <div className="summary-icon">
              📝
            </div>

            <div className="summary-info">

              <span className="summary-label">
                Exam Notices
              </span>

              <strong>
                {examNotices}
              </strong>

            </div>

          </div>

          <div className="student-summary-card">

            <div className="summary-icon">
              🎉
            </div>

            <div className="summary-info">

              <span className="summary-label">
                Event Notices
              </span>

              <strong>
                {eventNotices}
              </strong>

            </div>

          </div>

          <div className="student-summary-card">

            <div className="summary-icon">
              💼
            </div>

            <div className="summary-info">

              <span className="summary-label">
                Placement Notices
              </span>

              <strong>
                {placementNotices}
              </strong>

            </div>

          </div>

        </div>

        {/* ================================
            RECENTLY ADDED
        ================================= */}

        {recentlyAddedNotices.length > 0 && (

          <section className="recent-notices-section">

            <div className="section-heading">

              <div>
                <span className="section-label">
                  LATEST UPDATES
                </span>

                <h2>
                  Recently Added
                </h2>
              </div>

              <span className="recent-count">
                {recentlyAddedNotices.length} new
              </span>

            </div>

            <div className="recent-notices-grid">

              {recentlyAddedNotices.map((notice) => (

                <Link
                  to={`/notice/${notice.id}`}
                  key={notice.id}
                  className="recent-notice-link"
                >

                  <div className="recent-notice-card">

                    <div className="recent-card-top">

                      <span className="recent-category">

                        <span className="recent-category-icon">
                          {getCategoryIcon(
                            notice.category
                          )}
                        </span>

                        {notice.category}

                      </span>

                      {isNewNotice(
                        notice.created_at
                      ) && (
                        <span className="recent-new-badge">
                          NEW
                        </span>
                      )}

                    </div>

                    <h3>
                      {notice.title}
                    </h3>

                    <p>
                      {notice.description}
                    </p>

                    <div className="recent-card-footer">

                      <span>
                        📅{" "}
                        {new Date(
                          notice.created_at
                        ).toLocaleDateString()}
                      </span>

                      <span className="recent-view">
                        View →
                      </span>

                    </div>

                  </div>

                </Link>

              ))}

            </div>

          </section>

        )}

        {/* ================================
            ALL NOTICES
        ================================= */}

        <div className="latest-notices-heading">

          <div>

            <span className="section-label">
              CAMPUS UPDATES
            </span>

            <h2>
              Latest Notices
            </h2>

          </div>

          <span className="notice-count">
            {filteredNotices.length}{" "}
            {filteredNotices.length === 1
              ? "notice"
              : "notices"}
          </span>

        </div>

        {/* Notice List */}

        {noticesLoading ? (
          <div className="notices-loading">
            <div className="loading-spinner"></div>
            <p>Loading notices...</p>
          </div>
        ) : (
          <div className="notice-list">
            {filteredNotices.map((notice) => (
              <Link
                to={`/notice/${notice.id}`}
                key={notice.id}
                className="notice-link"
              >
                <div className="notice-card">
                  <div className="notice-top">

                    <div className="notice-category-group">

                      <span className="notice-category-icon">
                        {getCategoryIcon(notice.category)}
                      </span>

                      <span className="category">
                        {notice.category}
                      </span>

                      {isNewNotice(
                        notice.created_at
                      ) && (
                        <span className="new-badge">
                          NEW
                        </span>
                      )}

                    </div>

                    <span className="date">
                      📅{" "}
                      {new Date(
                        notice.created_at
                      ).toLocaleDateString()}
                    </span>

                  </div>

                  <div className="notice-content">

                    <h3>
                      {notice.title}
                    </h3>

                    <p>
                      {notice.description}
                    </p>

                  </div>

                  <div className="notice-footer">

                    <span>
                      📢 Campus Announcement
                    </span>

                    <span className="view-notice">
                      View Notice →
                    </span>

                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}

        {/* No Search Results */}

        {filteredNotices.length === 0 && (
          <div className="no-results">

            <div className="no-results-icon">
              🔍
            </div>

            <h3>
              No notices found
            </h3>

            <p>
              Try a different search term or category.
            </p>

            <button
              className="clear-filters-button"
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
            >
              Clear Filters
            </button>

          </div>
        )}

      </main>

    </div>
  );
}

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Home />}
        />

        <Route
          path="/notice/:id"
          element={<NoticeDetails />}
        />

        <Route
          path="/signup"
          element={<Signup />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;

