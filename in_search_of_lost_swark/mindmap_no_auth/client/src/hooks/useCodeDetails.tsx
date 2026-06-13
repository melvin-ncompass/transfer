import { useState } from "react";
import { useSessionStorage, useFetch } from "./index";

const useCodeDetails = () => {
    const [codeDetails, setCodeDetails] = useState<{ purpose: string, codeBlock: string, error: string, functionName: string, filePath: string, lineRange: string, parameters: string, returns: string, logic: string, dependencies: string, language: string } | null>(null);
    const { sessionRepo, sessionUser } = useSessionStorage();
    const { fetchData } = useFetch();
    const [loadingCode, setLoadingCode] = useState<boolean>(false);
    const fetchCodeDetails = async (nodeId: string, relativePath: string) => {
        try {
            setLoadingCode(true);
            console.log('🔍 Fetching code details for:', nodeId, relativePath);

            const result = await fetchData(
                'code-analyzer/explainFunction',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        relativePath: relativePath,
                        repo: sessionRepo(),
                        username: sessionUser()
                    })
                }
            )

            console.log('✅ Code details received:', result);
            setCodeDetails(result.data);
        } catch (err) {
            console.error('❌ Error fetching code details:', err);
            setCodeDetails({ purpose: 'Failed to fetch code details', codeBlock: '', error: 'Failed to fetch code details', functionName: '', filePath: '', lineRange: '', parameters: '', returns: '', logic: '', dependencies: '', language: '' });
        } finally {
            setLoadingCode(false);
        }
    };
    return { codeDetails, setCodeDetails, fetchCodeDetails, loadingCode, setLoadingCode };
};

export default useCodeDetails;