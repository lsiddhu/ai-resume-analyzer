import { Link } from "react-router-dom";

function NotFound() {
  const token = localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold tracking-tight text-slate-900">
          404
        </h1>

        <h2 className="mt-4 text-2xl font-bold text-slate-900">
          Page Not Found
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Sorry, the page you are looking for does not exist.
        </p>

        <Link
          to={token ? "/dashboard" : "/login"}
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-slate-800"
        >
          {token ? "Go to Dashboard" : "Go to Login"}
        </Link>
      </div>
    </div>
  );
}

export default NotFound;
