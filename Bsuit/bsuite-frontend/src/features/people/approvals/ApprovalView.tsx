import { forwardRef } from "react"
import { Approvals } from "./components/Approvals"

export const ApprovalView = forwardRef<{ openAddModal: () => void }>((_, ref) => {
    return <Approvals ref={ref} />
})