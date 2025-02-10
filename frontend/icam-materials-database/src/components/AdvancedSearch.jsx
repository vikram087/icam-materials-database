import { useEffect, useState } from "react";
import "../styles/filters.css";

function AdvancedSearch({
	searchParams,
	searchTerms,
	setSearchTerms,
	terms,
	toggleReset,
}) {
	const termsArray = searchParams.searches.map((search) => search.term);

	const [query, setQuery] = useState(termsArray || ["all"]);

	useEffect(() => {
		setSearchTerms(
			searchParams.searches || [
				{
					id: 1,
					term: "all",
					field: terms[0],
					operator: "AND",
					isVector: false,
				},
			],
		);
	}, [toggleReset]);

	useEffect(() => {
		setSearchTerms((prev) =>
			prev.map((item) => ({
				...item,
				field: terms[0],
			})),
		);
	}, [terms, setSearchTerms]);

	const addSearchTerm = () => {
		setSearchTerms((prev) => [
			...prev,
			{
				id: prev.length + 1,
				term: "",
				field: terms[0],
				operator: "AND",
				isVector: false,
			},
		]);
	};

	const updateSearchTerm = (id, key, value) => {
		setSearchTerms((prev) =>
			prev.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
		);
	};

	const removeSearchTerm = (id) => {
		setSearchTerms((prev) => prev.filter((item) => item.id !== id));
	};

	const toggleVectorSearch = (id) => {
		setSearchTerms((prev) =>
			prev.map(
				(item) =>
					item.id === id
						? { ...item, isVector: !item.isVector } // flip it
						: { ...item, isVector: false }, // or false if not the clicked row
			),
		);
	};

	const changeQuery = (newValue, index) => {
		setQuery((prevQuery) => {
			const updatedQuery = [...prevQuery];
			updatedQuery[index] = newValue;
			return updatedQuery;
		});
	};

	return (
		<div className="advanced-search-card">
			<h3>Advanced Search</h3>
			{searchTerms.map((item, index) => (
				<div
					key={`${item.id}_${item.term}_${item.field}`}
					className="as-search-row"
				>
					{/* Operator for rows after the first */}
					{index > 0 && (
						<ASearchDropdown
							options={["AND", "OR", "NOT"]}
							value={item.operator}
							onChange={(value) => updateSearchTerm(item.id, "operator", value)}
						/>
					)}

					{/* Search Term Input */}
					<input
						type="text"
						className="as-search-input"
						placeholder={`Search term #${item.id}`}
						value={query[index] ?? ""}
						onChange={(e) => changeQuery(e.target.value, index)}
						onBlur={(e) => updateSearchTerm(item.id, "term", e.target.value)}
					/>

					{/* Field Dropdown (Abstract, Title, etc.) */}
					<ASearchDropdown
						options={terms}
						value={item.field}
						onChange={(value) => updateSearchTerm(item.id, "field", value)}
					/>

					{/* Vector Search Checkbox */}
					<label className="vector-search-label">
						<input
							type="checkbox"
							disabled={terms[0] === "Material" || query[0] === "all"}
							checked={item.isVector}
							onChange={() => toggleVectorSearch(item.id)}
						/>
						Vector
					</label>

					{/* Remove button (only on additional rows, not the first) */}
					{index > 0 && (
						<button
							type="button"
							className="remove-term-btn"
							onClick={() => removeSearchTerm(item.id)}
						>
							&times;
						</button>
					)}
				</div>
			))}

			<div className="as-btn-group">
				<button
					type="button"
					className="add-term-btn"
					onClick={addSearchTerm}
					disabled={query[0] === "all"}
				>
					+ Add Term
				</button>
				{query[0] === "all" && (
					<span style={{ marginLeft: 10 }}>
						Cannot add new terms or vector search with keyword "all"
					</span>
				)}
			</div>
		</div>
	);
}

function ASearchDropdown({ options, value, onChange }) {
	return (
		<div className="as-dropdown">
			<button type="button" className="as-dropdown-btn">
				{value} ▼
			</button>
			<div className="as-dropdown-menu">
				{options.map((option) => (
					<div
						key={option}
						className="as-dropdown-item"
						onClick={() => onChange(option)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								onChange(option);
							}
						}}
						role="button"
						tabIndex={0}
					>
						{option}
					</div>
				))}
			</div>
		</div>
	);
}

export default AdvancedSearch;
