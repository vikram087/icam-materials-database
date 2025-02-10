import parse from "html-react-parser";
import DOMPurify from "dompurify";
import { MathJax, MathJaxContext } from "better-react-mathjax";

function Content({ content, mode = "both" }) {
	const config = {
		loader: { load: ["[tex]/html"] },
		tex: {
			packages: { "[+]": ["html"] },
			inlineMath: [
				["$", "$"],
				["\\(", "\\)"],
			],
			displayMath: [
				["$$", "$$"],
				["\\[", "\\]"],
			],
		},
	};

	const sanitizedContent = DOMPurify.sanitize(content);
	let parsedContent = parse(sanitizedContent);

	if (mode === "highlightOnly") {
		return <>{parsedContent}</>;
	}

	if (mode === "mathOnly") {
		parsedContent = parse(sanitizedContent);

		return (
			<MathJaxContext version={3} config={config}>
				<MathJax hideUntilTypeset="first">{parsedContent}</MathJax>
			</MathJaxContext>
		);
	}

	return (
		<MathJaxContext version={3} config={config}>
			<MathJax hideUntilTypeset="first">{parsedContent}</MathJax>
		</MathJaxContext>
	);
}

export default Content;
