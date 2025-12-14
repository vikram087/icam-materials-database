import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/search.css";
import Tooltip from "./Tooltip";

function Search({ searchParams, to }) {
	const location = useLocation();
	const options =
		to === "/properties"
			? [
					"Material",
					"Description",
					"Symmetry or Phase Labels",
					"Synthesis",
					"Characterization",
					"Property",
					"Application",
					"Abstract",
					"Title",
					"Authors",
					"Category",
				]
			: [
					"Abstract",
					"Title",
					"Authors",
					"Category",
					"Material",
					"Description",
					"Symmetry or Phase Labels",
					"Synthesis",
					"Characterization",
					"Property",
					"Application",
				];

	useEffect(() => {
		const query = new URLSearchParams(location.search);
		const searchQuery = query.get("searches");

		let val;
		if (searchQuery) {
			val = JSON.parse(decodeURIComponent(searchQuery))[0]?.field;
		}
		setTermVal(val || searchParams.searches[0]?.field || "Abstract");
	}, [location.search, searchParams.searches]);

	const [inputValue, setInputValue] = useState("");
	const [termVal, setTermVal] = useState("Abstract");

	const navigate = useNavigate();

	const goToSearch = (query) => {
		let quer = query;
		if (query === "") {
			quer = "all";
		}

		let modified = searchParams.searches || [
			{
				term: "all",
				field: "Abstract",
				isVector: false,
				operator: "AND",
			},
		];
		modified[0].field = termVal;
		modified[0].term = quer;
		modified[0].isVector =
			quer !== "all" &&
			(termVal.toLowerCase() === "abstract" ||
				termVal.toLowerCase() === "title");

		if (quer === "all") {
			modified = modified.slice(0, 1);
		}

		const advStr = encodeURIComponent(JSON.stringify(modified));

		navigate(
			`${to}?page=1&per_page=${searchParams.per_page}` +
				`&sort=${searchParams.sorting}` +
				`&date=${searchParams.date}&searches=${advStr}`,
		);
	};

	const handleChange = (event) => {
		setInputValue(event.target.value);
	};

	const handleKeyDown = (event) => {
		if (event.key === "Enter") {
			submitValue(inputValue);
		}
	};

	const submitValue = (value) => {
		goToSearch(value);
		setInputValue("");
	};

	return (
		<div className="w-full max-w-3xl mx-auto">
			<div className="space-y-4">
				{/* Search Input Container */}
				<div className="relative">
					<div className="flex gap-3">
						<div className="relative flex-1">
							<input
								type="text"
								value={inputValue}
								onChange={handleChange}
								onKeyDown={handleKeyDown}
								placeholder="Search database..."
								className="w-full px-5 py-3.5 pr-12 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10 transition-all duration-300 placeholder:text-gray-400"
							/>
							<div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Search</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
									/>
								</svg>
							</div>
						</div>
						<button
							type="button"
							onClick={() => submitValue(inputValue)}
							className="px-6 py-3.5 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 hover:shadow-lg transition-all duration-300 flex items-center gap-2 whitespace-nowrap"
						>
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Submit</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
								/>
							</svg>
							<span className="hidden sm:inline">Search</span>
						</button>
					</div>
				</div>

				{/* Search Options */}
				<div className="flex flex-col sm:flex-row sm:items-center gap-4">
					{/* Field Selector */}
					<div className="flex items-center gap-3">
						<label
							htmlFor="search-field"
							className="text-sm font-semibold text-gray-700 whitespace-nowrap"
						>
							Search in:
						</label>
						<select
							id="search-field"
							value={termVal}
							onChange={(e) => setTermVal(e.target.value)}
							className="px-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition-all duration-300 bg-white cursor-pointer hover:border-gray-300"
						>
							{options.map((option) => (
								<option key={option} value={option}>
									{option}
								</option>
							))}
						</select>
					</div>

					{/* Advanced Search Button */}
					<div className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => navigate("/advanced")}
							className="px-4 py-2 text-sm font-semibold text-slate-900 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:text-red-500 transition-all duration-300"
						>
							Advanced Search
						</button>
						<Tooltip text="Search with more refined queries" />
					</div>
				</div>

				{/* Search Tips */}
				<div className="search-tips-container">
					<details className="group">
						<summary className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 hover:text-gray-900 transition-colors duration-300">
							<svg
								className="w-4 h-4 transition-transform duration-300 group-open:rotate-90"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Tips</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 5l7 7-7 7"
								/>
							</svg>
							<span className="font-medium">Search Tips</span>
						</summary>
						<div className="mt-3 pl-6 space-y-2 text-sm text-gray-600">
							<p className="flex items-start gap-2">
								<svg
									className="w-4 h-4 mt-0.5 text-red-500 shrink-0"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<title>Abstract</title>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
								<span>
									Use <strong>Abstract</strong> or <strong>Title</strong> for
									semantic AI-powered search
								</span>
							</p>
							<p className="flex items-start gap-2">
								<svg
									className="w-4 h-4 mt-0.5 text-red-500 shrink-0"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<title>Search concepts</title>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
								<span>
									Try searching by concepts rather than exact keywords
								</span>
							</p>
							<p className="flex items-start gap-2">
								<svg
									className="w-4 h-4 mt-0.5 text-red-500 shrink-0"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<title>Advanced search</title>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
								<span>
									Use <strong>Advanced Search</strong> for combining multiple
									criteria
								</span>
							</p>
						</div>
					</details>
				</div>
			</div>
		</div>
	);
}

export default Search;
