import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { TailSpin } from "react-loader-spinner";
import Content from "../components/mathjax";
import "../styles/paper-detail.css";
import NavBar from "../components/navbar";

function PaperDetail({ prevUrl, selectedPaper }) {
	const [highlightedStars, setHighlightedStars] = useState([]);
	const [paper, setPaper] = useState(selectedPaper);
	const { id } = useParams();
	const navigate = useNavigate();

	useEffect(() => {
		const storedStars =
			JSON.parse(localStorage.getItem("highlightedStars")) || [];
		setHighlightedStars(Array.isArray(storedStars) ? storedStars : []);

		if (!selectedPaper?.id) {
			const backend_url = import.meta.env.VITE_BACKEND_URL;

			fetch(`${backend_url}/papers/${id}`, {
				method: "GET",
			})
				.then((response) => response.json())
				.then((data) => {
					setPaper(data);
				});
		}
	}, [id, selectedPaper]);

	const goBack = () => {
		if (prevUrl) {
			navigate(prevUrl);
		} else {
			navigate("/");
		}
	};

	const replaceID = (id) => {
		if (!id) return "";
		const lastIndex = id.lastIndexOf("-");

		if (lastIndex !== -1) {
			return `${id.substring(0, lastIndex)}/${id.substring(lastIndex + 1)}`;
		}

		return id;
	};

	const numToDate = (date) => {
		const monthsReversed = {
			"01": "January,",
			"02": "February,",
			"03": "March,",
			"04": "April,",
			"05": "May,",
			"06": "June,",
			"07": "July,",
			"08": "August,",
			"09": "September,",
			10: "October,",
			11: "November,",
			12: "December,",
		};
		const year = date.substring(0, 4);
		const month = monthsReversed[date.substring(4, 6)];
		const day = date.substring(6);

		return `${day} ${month} ${year}`;
	};

	const toggleStar = (paper) => {
		setHighlightedStars((prev) => {
			const isStarred = prev.some((p) => p.id === paper?.id);

			const newStars = isStarred
				? prev.filter((p) => p.id !== paper?.id)
				: [...prev, paper];

			localStorage.setItem("highlightedStars", JSON.stringify(newStars));
			return newStars;
		});
	};

	const renderFieldWithIcon = (icon, label, content) => (
		<div className="detail-field">
			<div className="detail-label">
				{icon}
				<span>{label}</span>
			</div>
			<div className="detail-content">{content}</div>
		</div>
	);

	const renderList = (items, emptyText = "N/A") => {
		if (!Array.isArray(items) || items.length === 0) {
			return <span className="text-gray-400 italic">{emptyText}</span>;
		}
		return items.map((item, index) => (
			<span key={`${index}_${item}`} className="inline">
				<Content content={item} />
				{index < items.length - 1 ? ", " : ""}
			</span>
		));
	};

	const renderBadgeList = (items, emptyText = "N/A") => {
		if (!Array.isArray(items) || items.length === 0) {
			return <span className="text-gray-400 italic">{emptyText}</span>;
		}
		return (
			<div className="flex flex-wrap gap-2 mt-2">
				{items.map((item, index) => (
					<span
						key={`${index}_${item}`}
						className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
					>
						<Content content={item} />
					</span>
				))}
			</div>
		);
	};

	return paper ? (
		<div className="min-h-screen bg-gray-50">
			<NavBar />
			<div className="h-20" />
			<div>
				<div className="bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6 lg:p-10">
					<button
						type="button"
						onClick={goBack}
						className="inline-flex items-center gap-2 mb-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border-2 border-gray-200 rounded-lg hover:border-red-500 hover:text-red-500 transition-all duration-300"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Back</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M15 19l-7-7 7-7"
							/>
						</svg>
						Back to Results
					</button>
					<div className="flex items-start justify-between gap-4 mb-4">
						<h1 className="font-serif text-3xl lg:text-4xl font-bold leading-tight flex-1">
							<Content content={paper?.title} />
						</h1>
						<button
							type="button"
							onClick={() => toggleStar(paper)}
							className="shrink-0 p-3 hover:bg-white/10 rounded-lg transition-colors duration-300"
							aria-label={
								highlightedStars.some((p) => p.id === paper?.id)
									? "Remove from favorites"
									: "Add to favorites"
							}
						>
							{highlightedStars.some((p) => p.id === paper?.id) ? (
								<svg
									className="w-6 h-6 text-amber-400"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<title>Star</title>
									<path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
								</svg>
							) : (
								<svg
									className="w-6 h-6 text-white/70 hover:text-amber-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Star</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
									/>
								</svg>
							)}
						</button>
					</div>

					{/* Authors */}
					<div className="flex items-start gap-2 text-white/90 mb-4">
						<svg
							className="w-5 h-5 mt-0.5 shrink-0"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<title>Authors</title>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
							/>
						</svg>
						<div className="text-base">
							{paper?.authors?.map((author, index) => (
								<span key={`${author}_detail`}>
									<Content content={author} mode="highlightOnly" />
									{index < paper?.authors?.length - 1 ? ", " : ""}
								</span>
							))}
						</div>
					</div>

					{/* Meta Information */}
					<div className="flex flex-wrap gap-4 text-sm text-white/80">
						<div className="flex items-center gap-2">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Date</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
								/>
							</svg>
							<span>Submitted: {numToDate(String(paper?.date))}</span>
						</div>
						<div className="flex items-center gap-2">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Updated</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
								/>
							</svg>
							<span>Updated: {numToDate(String(paper?.updated))}</span>
						</div>
					</div>
				</div>

				{/* Content Section */}
				<div className="p-6 lg:p-10 space-y-8">
					{/* Abstract */}
					<div>
						<h2 className="detail-section-title">Abstract</h2>
						<div className="text-gray-700 leading-relaxed text-base lg:text-lg">
							<Content content={paper?.summary} />
						</div>
					</div>

					{/* Identifiers & Links */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{renderFieldWithIcon(
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>ID</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
								/>
							</svg>,
							"arXiv ID",
							<a
								href={`https://arxiv.org/abs/${replaceID(paper?.id)}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-red-500 hover:text-red-600 font-medium hover:underline"
							>
								{replaceID(paper?.id)}
							</a>,
						)}

						{renderFieldWithIcon(
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>DOI</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
								/>
							</svg>,
							"DOI",
							paper?.doi ? (
								<a
									href={`https://doi.org/${paper.doi}`}
									target="_blank"
									rel="noopener noreferrer"
									className="text-red-500 hover:text-red-600 font-medium hover:underline break-all"
								>
									{paper.doi}
								</a>
							) : (
								<span className="text-gray-400 italic">Not available</span>
							),
						)}
					</div>

					{/* Links */}
					{paper?.links && paper.links.length > 0 && (
						<div>
							{renderFieldWithIcon(
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Links</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
									/>
								</svg>,
								"External Links",
								<div className="space-y-2">
									{paper.links.map((link, index) => (
										<a
											key={`${index}_${link}`}
											href={link}
											target="_blank"
											rel="noopener noreferrer"
											className="block text-red-500 hover:text-red-600 hover:underline break-all text-sm"
										>
											{link}
										</a>
									))}
								</div>,
							)}
						</div>
					)}

					{/* Categories */}
					<div>
						{renderFieldWithIcon(
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
								/>
								<title>Categories</title>
							</svg>,
							"Categories",
							<div className="flex flex-wrap gap-2">
								{paper?.categories?.map((category, index) => (
									<span
										key={`${index}_${category}`}
										className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200"
									>
										<Content content={category} mode="highlightOnly" />
									</span>
								))}
							</div>,
						)}
					</div>

					{/* Primary Category */}
					{paper?.primary_category && (
						<div>
							{renderFieldWithIcon(
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Category</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
									/>
								</svg>,
								"Primary Category",
								<span className="font-medium text-gray-900">
									{paper.primary_category}
								</span>,
							)}
						</div>
					)}

					{/* Comments */}
					{paper?.comments && (
						<div>
							{renderFieldWithIcon(
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Comments</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
									/>
								</svg>,
								"Comments",
								<span className="text-gray-700">{paper.comments}</span>,
							)}
						</div>
					)}

					{/* Journal Reference */}
					{paper?.journal_ref && (
						<div>
							{renderFieldWithIcon(
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<title>Journal Reference</title>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
									/>
								</svg>,
								"Journal Reference",
								<span className="text-gray-700">{paper.journal_ref}</span>,
							)}
						</div>
					)}

					{/* Materials Science Data Section */}
					<div className="pt-8 border-t-2 border-gray-200">
						<h2 className="detail-section-title mb-6">
							<svg
								className="w-6 h-6 inline-block mr-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<title>Properties</title>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
								/>
							</svg>
							Materials Science Properties
						</h2>

						<div className="space-y-6">
							{/* Materials */}
							<div>
								{renderFieldWithIcon(
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Materials</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
										/>
									</svg>,
									"Materials",
									renderBadgeList(paper?.MAT),
								)}
							</div>

							{/* Description of Sample */}
							<div>
								{renderFieldWithIcon(
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Sample</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
										/>
									</svg>,
									"Description of Sample",
									renderList(paper?.DSC),
								)}
							</div>

							{/* Symmetry or Phase Labels */}
							<div>
								{renderFieldWithIcon(
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Symmetry</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
										/>
									</svg>,
									"Symmetry or Phase Labels",
									renderList(paper?.SPL),
								)}
							</div>

							{/* Synthesis Methods */}
							<div>
								{renderFieldWithIcon(
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Synthesis</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
										/>
									</svg>,
									"Synthesis Methods",
									renderList(paper?.SMT),
								)}
							</div>

							{/* Characterization Methods */}
							<div>
								{renderFieldWithIcon(
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Characterization Methods</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
										/>
									</svg>,
									"Characterization Methods",
									renderList(paper?.CMT),
								)}
							</div>

							{/* Properties */}
							<div>
								{renderFieldWithIcon(
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Properties</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13 10V3L4 14h7v7l9-11h-7z"
										/>
									</svg>,
									"Properties",
									renderList([
										...(Array.isArray(paper?.PRO) ? paper.PRO : []),
										...(Array.isArray(paper?.PVL) ? paper.PVL : []),
										...(Array.isArray(paper?.PUT) ? paper.PUT : []),
									]),
								)}
							</div>

							{/* Applications */}
							<div>
								{renderFieldWithIcon(
									<svg
										className="w-5 h-5"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<title>Applications</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
										/>
									</svg>,
									"Applications",
									renderList(paper?.APL),
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	) : (
		<div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
			<TailSpin color="#e94560" height={80} width={80} />
			<p className="mt-6 text-lg text-gray-600 font-medium">
				Loading paper details...
			</p>
		</div>
	);
}

export default PaperDetail;
