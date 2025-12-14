import { useNavigate } from "react-router-dom";

function NavBar() {
	const currentDate = new Date();
	const now = currentDate.toISOString().slice(0, 10).replaceAll(/-/g, "");
	const navigate = useNavigate();

	const goToSearch = (query, page, term) => {
		const quer = query === "" ? "all" : query;
		const advStr = encodeURIComponent(
			JSON.stringify([
				{
					term: quer,
					field: term,
					isVector: false,
					operator: "AND",
				},
			]),
		);

		navigate(
			`${page}?page=1&per_page=20&sort=Most-Relevant&date=00000000-${now}&searches=${advStr}`,
		);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	return (
		<nav className="fixed top-0 left-0 right-0 bg-white/98 backdrop-blur-md border-b border-gray-200 z-50 transition-all duration-300">
			<div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 lg:py-6 flex justify-between items-center">
				<button
					className="nav-link hover:text-red-500 font-serif text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight"
					onClick={() => navigate("/")}
					type="button"
				>
					Matsearch
				</button>
				<div className="flex gap-6 lg:gap-10">
					<button
						onClick={() => goToSearch("all", "/papers", "Abstract")}
						className="nav-link text-sm lg:text-base font-medium text-gray-700 hover:text-red-500 px-2 lg:px-4 py-2 rounded transition-all duration-300 relative"
						type="button"
					>
						Research
					</button>
					<button
						onClick={() => goToSearch("all", "/properties", "Material")}
						className="nav-link text-sm lg:text-base font-medium text-gray-700 hover:text-red-500 px-2 lg:px-4 py-2 rounded transition-all duration-300 relative"
						type="button"
					>
						Materials
					</button>
					<button
						onClick={() => navigate("/favorites")}
						className="nav-link text-sm lg:text-base font-medium text-gray-700 hover:text-red-500 px-2 lg:px-4 py-2 rounded transition-all duration-300 relative"
						type="button"
					>
						Favorites
					</button>
				</div>
			</div>
		</nav>
	);
}

export default NavBar;
