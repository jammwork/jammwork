import type { YjsDocumentManager } from "@jammwork/api";
import { useRef } from "react";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

interface UseDocumentManagerProps {
	backendUrl: string;
	userId: string;
	spaceId?: string;
}

export const useDocumentManager = ({
	backendUrl,
	userId,
	spaceId = "default-canvas",
}: UseDocumentManagerProps): YjsDocumentManager => {
	const documentsRef = useRef<Map<string, Y.Doc>>(new Map());
	const providersRef = useRef<Map<string, WebsocketProvider>>(new Map());
	const documentManagerRef = useRef<YjsDocumentManager | null>(null);

	// Don't create document manager if required parameters are missing
	if (!backendUrl || !userId) {
		throw new Error(
			"Missing required parameters: backendUrl and userId are required",
		);
	}

	// Only create documentManager once
	if (!documentManagerRef.current) {
		// Document manager for plugins
		const documentManager: YjsDocumentManager = {
			getDocument: (documentId: string) => {
				let doc = documentsRef.current.get(documentId);
				if (!doc) {
					doc = new Y.Doc();
					documentsRef.current.set(documentId, doc);

					const provider = new WebsocketProvider(
						backendUrl,
						`${spaceId}-${documentId}`,
						doc,
					);
					provider.awareness.setLocalStateField("user", {
						id: userId,
						name: `User ${userId}`,
						documentId,
					});
					providersRef.current.set(documentId, provider);
				}
				return doc;
			},

			createDocument: (documentId: string) => {
				if (documentsRef.current.has(documentId)) {
					throw new Error(`Document ${documentId} already exists`);
				}
				return documentManager.getDocument(documentId);
			},

			deleteDocument: (documentId: string) => {
				const doc = documentsRef.current.get(documentId);
				const provider = providersRef.current.get(documentId);

				if (doc) {
					doc.destroy();
					documentsRef.current.delete(documentId);
				}

				if (provider) {
					provider.destroy();
					providersRef.current.delete(documentId);
				}
			},

			getProvider: (documentId: string): unknown => {
				return providersRef.current.get(documentId);
			},
		};

		documentManagerRef.current = documentManager;
	}

	return documentManagerRef.current;
};
