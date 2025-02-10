import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/search.css";

function Search({ searchParams, to, options }) {
	const location = useLocation();

	useEffect(() => {
		const query = new URLSearchParams(location.search);
		const searchQuery = query.get("searches");
		let hide = query.get("advanced");

		if (hide === "false") {
			hide = false;
		} else {
			hide = true;
		}

		let val;
		if (searchQuery) {
			val = JSON.parse(decodeURIComponent(searchQuery))[0]?.field;
		}
		setTermVal(val || searchParams.searches[0]?.field || "Abstract");
		setHidden(hide || false);
	}, [location.search, searchParams.searches]);

	const [inputValue, setInputValue] = useState("");
	const [termVal, setTermVal] = useState("Abstract");
	const [hidden, setHidden] = useState(false);

	const navigate = useNavigate();

	const goToSearch = (query) => {
		let quer = query;
		if (query === "") {
			quer = "all";
		}

		const modified = searchParams.searches || [
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

		const advStr = encodeURIComponent(JSON.stringify(modified));

		navigate(
			`${to}?page=1&per_page=${searchParams.per_page}` +
				`&sort=${searchParams.sorting}` +
				`&date=${searchParams.date}&advanced=false&searches=${advStr}`,
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
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				gap: "10px",
				width: "100%",
			}}
		>
			<div
				className="cont"
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					width: "100%",
				}}
			>
				<div
					className="searchBox"
					style={{
						display: "flex",
						alignItems: "center",
						gap: "10px",
						width: "100%",
						maxWidth: "600px",
					}}
				>
					<input
						className="searchInput"
						type="text"
						value={inputValue}
						onChange={handleChange}
						onKeyDown={handleKeyDown}
						placeholder="Search Database"
					/>
					<button
						type="button"
						className="searchButton"
						href="#"
						onClick={() => submitValue(inputValue)}
					>
						<svg
							role="img"
							aria-label="submit button"
							xmlns="http://www.w3.org/2000/svg"
							width="29"
							height="29"
							viewBox="0 0 29 29"
							fill="none"
						>
							<g clipPath="url(#clip0_2_17)">
								<g filter="url(#filter0_d_2_17)">
									<path
										d="M23.7953 23.9182L19.0585 19.1814M19.0585 19.1814C19.8188 18.4211 20.4219 17.5185 20.8333 16.5251C21.2448 15.5318 21.4566 14.4671 21.4566 13.3919C21.4566 12.3167 21.2448 11.252 20.8333 10.2587C20.4219 9.2653 19.8188 8.36271 19.0585 7.60242C18.2982 6.84214 17.3956 6.23905 16.4022 5.82759C15.4089 5.41612 14.3442 5.20435 13.269 5.20435C12.1938 5.20435 11.1291 5.41612 10.1358 5.82759C9.1424 6.23905 8.23981 6.84214 7.47953 7.60242C5.94407 9.13789 5.08145 11.2204 5.08145 13.3919C5.08145 15.5634 5.94407 17.6459 7.47953 19.1814C9.01499 20.7168 11.0975 21.5794 13.269 21.5794C15.4405 21.5794 17.523 20.7168 19.0585 19.1814Z"
										stroke="white"
										strokeWidth="3"
										strokeLinecap="round"
										strokeLinejoin="round"
										shapeRendering="crispEdges"
									/>
								</g>
							</g>
							<defs>
								<filter
									id="filter0_d_2_17"
									x="-0.418549"
									y="3.70435"
									width="29.7139"
									height="29.7139"
									filterUnits="userSpaceOnUse"
									colorInterpolationFilters="sRGB"
								>
									<feFlood floodOpacity="0" result="BackgroundImageFix" />
									<feColorMatrix
										in="SourceAlpha"
										type="matrix"
										values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
										result="hardAlpha"
									/>
									<feOffset dy="4" />
									<feGaussianBlur stdDeviation="2" />
									<feComposite in2="hardAlpha" operator="out" />
									<feColorMatrix
										type="matrix"
										values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
									/>
									<feBlend
										mode="normal"
										in2="BackgroundImageFix"
										result="effect1_dropShadow_2_17"
									/>
									<feBlend
										mode="normal"
										in="SourceGraphic"
										in2="effect1_dropShadow_2_17"
										result="shape"
									/>
								</filter>
								<clipPath id="clip0_2_17">
									<rect
										width="28.0702"
										height="28.0702"
										fill="white"
										transform="translate(0.403503 0.526367)"
									/>
								</clipPath>
							</defs>
						</svg>
					</button>
				</div>
				<div className="search-dropdown-container">
					<span>Search Term: </span>
					<select
						id="options"
						name="options"
						value={termVal}
						onChange={(e) => setTermVal(e.target.value)}
						className="search-dropdown"
					>
						{options.map((option) => (
							<option
								key={option}
								value={option}
								className="search-dropdown-option"
							>
								{option}
							</option>
						))}
					</select>
				</div>
				<button
					type="button"
					onClick={() => navigate("/advanced")}
					style={{
						padding: "10px 20px",
						backgroundColor: "#007bff",
						color: "#fff",
						border: "none",
						borderRadius: "4px",
						cursor: "pointer",
						marginTop: "15px",
						width: "fit-content",
					}}
				>
					Advanced Search
				</button>
			</div>
		</div>
	);
}

export default Search;
