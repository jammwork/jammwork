import type { Element } from "@jammwork/api";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { streamManager } from "./streamManager";

interface ScreenShareRendererProps {
	element: Element;
}

export const ScreenShareRenderer: React.FC<ScreenShareRendererProps> = ({
	element,
}) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [stream, setStream] = useState<MediaStream | null>(null);

	const streamId = element.properties.streamId as string;
	const userId = element.properties.userId as string;
	const title = (element.properties.title as string) || `${userId}'s Screen`;

	useEffect(() => {
		const unsubscribe = streamManager.subscribe(streamId, setStream);
		return unsubscribe;
	}, [streamId]);

	useEffect(() => {
		if (videoRef.current && stream) {
			videoRef.current.srcObject = stream;
			videoRef.current.play().catch(console.error);
		}
	}, [stream]);

	return (
		<g transform={`translate(${element.x}, ${element.y})`}>
			{/* Background rectangle */}
			<rect
				width={element.width}
				height={element.height}
				fill="#000"
				stroke="#ccc"
				strokeWidth={1}
				rx={8}
				ry={8}
			/>

			{/* Title bar */}
			<rect width={element.width} height={24} fill="#333" rx={8} ry={8} />
			<rect width={element.width} height={12} y={12} fill="#333" />

			{/* Title text */}
			<text
				x={8}
				y={16}
				fill="#fff"
				fontSize="12"
				fontFamily="system-ui, sans-serif"
			>
				{title}
			</text>

			{/* Video content */}
			{stream ? (
				<foreignObject
					x={1}
					y={25}
					width={element.width - 2}
					height={element.height - 26}
				>
					<div
						style={{
							width: "100%",
							height: "100%",
							backgroundColor: "#000",
						}}
					>
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							style={{
								width: "100%",
								height: "100%",
								objectFit: "contain",
								backgroundColor: "#000",
							}}
						/>
					</div>
				</foreignObject>
			) : (
				<g>
					<rect
						x={1}
						y={25}
						width={element.width - 2}
						height={element.height - 26}
						fill="#1a1a1a"
					/>
					<text
						x={element.width / 2}
						y={element.height / 2}
						textAnchor="middle"
						fill="#666"
						fontSize="14"
						fontFamily="system-ui, sans-serif"
					>
						Connecting...
					</text>
				</g>
			)}
		</g>
	);
};
