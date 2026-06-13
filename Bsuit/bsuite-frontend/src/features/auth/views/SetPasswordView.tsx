import SetPassword from "../Login/components/SetPassword";
import LinkExpiredPage from "../Login/components/LinkExpired";
import { useVerifyMagicLinkMutation } from "../api/auth.api";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function SetPasswordView() {
    const { token } = useParams();
    const [verifyMagicLink] = useVerifyMagicLinkMutation();
    const [valid, setValid] = useState<null | boolean>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLink = async () => {
            if (!token) {
                setValid(false);
                setLoading(false);
                return;
            }
            try {
                await verifyMagicLink({ token }).unwrap();
                setValid(true);
            } catch {
                setValid(false);
            } finally {
                setLoading(false);
            }
        };
        checkLink();
        // eslint-disable-next-line
    }, [token]);

    if (loading) return null;
    if (!valid) return <LinkExpiredPage />;
    return <SetPassword />;
}

export default SetPasswordView;