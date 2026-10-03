
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

function NoticeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [notice, setNotice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadNotice() {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("id", id)
        .single();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Supabase Error:", error);
      } else {
        setNotice(data);
      }

      setLoading(false);
    }

    loadNotice();

    return () => {
      isMounted = false;
    };
  }, [id]);

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

  if (loading) {
    return (
      <div className="notice-details-page">
        <div className="notice-details-loading">
          <div className="loading-spinner"></div>
          <p>Loading notice...</p>
        </div>
      </div>
    );
  }

  if (!notice) {
    return (
      <div className="notice-details-page">
        <div className="notice-not-found">
          <div className="not-found-icon">🔍</div>

          <h2>Notice Not Found</h2>

          <p>
            The notice you are looking for may have been
            removed or is no longer available.
          </p>

          <button
            className="back-notices-button"
            onClick={() => navigate("/")}
          >
            ← Back to Notices
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="notice-details-page">
      <div className="notice-details-wrapper">

        {/* Back Button */}

        <button
          className="back-notices-button"
          onClick={() => navigate("/")}
        >
          ← Back to Notices
        </button>

        {/* Notice Details Card */}

        <article className="notice-details-card">

          {/* Top Section */}

          <div className="notice-details-top">
            <div className="notice-details-category">
              <span className="notice-details-icon">
                {getCategoryIcon(notice.category)}
              </span>

              <span className="notice-details-badge">
                {notice.category}
              </span>
            </div>

            <span className="notice-details-date">
              📅 Published on{" "}
              {new Date(
                notice.created_at
              ).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>

          {/* Title */}

          <div className="notice-details-heading">
            <span className="notice-details-label">
              📢 CAMPUS ANNOUNCEMENT
            </span>

            <h1>
              {notice.title}
            </h1>
          </div>

          {/* Description */}

          <div className="notice-details-description">
            <h3>
              Notice Details
            </h3>

            <p>
              {notice.description}
            </p>
          </div>

          {/* Footer */}

          <div className="notice-details-footer">
            <span>
              📌 Please follow the instructions mentioned
              in this notice.
            </span>

            <button
              className="back-notices-button secondary"
              onClick={() => navigate("/")}
            >
              View All Notices →
            </button>
          </div>

        </article>
      </div>
    </div>
  );
}

export default NoticeDetails;

