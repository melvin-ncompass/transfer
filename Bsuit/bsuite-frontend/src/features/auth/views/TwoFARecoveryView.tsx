import LinkExpiredPage from "../Login/components/LinkExpired";
import { useVerifyTwoFaRecoveryLinkQuery } from "../api/auth.api";
import { useParams } from "react-router-dom";
import TwoFARecovery from "../Login/components/TwoFARecovery";

function TwoFARecoveryView() {
    const { token } = useParams();
    const { data, error, isLoading } = useVerifyTwoFaRecoveryLinkQuery({ token: token || "" }, { skip: !token });
    if (isLoading) return null;
    if (error) return <LinkExpiredPage />;
    if (data) return <TwoFARecovery />;

    return <LinkExpiredPage />;
}

export default TwoFARecoveryView; 