import { adminDb } from "@/firebase/firebaseAdmin";
import { ERROR_REPORT_COLLECTION } from "@/libs/constants";
import moment from "moment";
import { v4 as uuidv4 } from 'uuid';

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function addErrorReport(from: string, data: Record<string, any>) {

    const webhookHistoryRef = adminDb.collection(ERROR_REPORT_COLLECTION);
    await webhookHistoryRef.doc(uuidv4()).set({
        from: from,
        data: data,
        requested_at: moment().format('X')
    });

}