const WHATSAPP_API_VERSION = 'v21.0';

function getConfig() {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId) return null;
    return { token, phoneNumberId };
}

function formatPhoneNumber(phone) {
    let cleaned = String(phone).replace(/[\s\-\(\)]/g, '');
    if (cleaned.startsWith('+')) cleaned = cleaned.slice(1);
    if (cleaned.length === 10) cleaned = '91' + cleaned;
    return cleaned;
}

async function sendTemplate(phoneNumber, templateName, parameters) {
    const config = getConfig();
    if (!config) {
        console.log('[WhatsApp] Skipped — no WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID configured');
        return null;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${config.phoneNumberId}/messages`;

    const body = {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: {
            name: templateName,
            language: { code: 'en' },
            components: parameters.length > 0
                ? [{ type: 'body', parameters: parameters.map(p => ({ type: 'text', text: String(p) })) }]
                : []
        }
    };

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${config.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (!res.ok) {
            console.error('[WhatsApp] API error:', JSON.stringify(data));
            return null;
        }

        console.log(`[WhatsApp] Sent "${templateName}" to ${formattedPhone}`, data.messages?.[0]?.id);
        return data;
    } catch (err) {
        console.error('[WhatsApp] Network error:', err.message);
        return null;
    }
}

async function notifyComplaintCreated(complaint) {
    if (!complaint.phone) return null;

    return sendTemplate(complaint.phone, 'complaint_created', [
        complaint.name || 'Citizen',
        complaint.complaint_id,
        complaint.issue_type,
        complaint.department
    ]);
}

async function notifyStatusUpdate(complaint, newStatus) {
    if (!complaint.phone) return null;

    if (newStatus === 'Resolved') {
        return sendTemplate(complaint.phone, 'complaint_resolved', [
            complaint.name || 'Citizen',
            complaint.complaint_id,
            complaint.issue_type
        ]);
    }

    return sendTemplate(complaint.phone, 'status_update', [
        complaint.name || 'Citizen',
        complaint.complaint_id,
        newStatus
    ]);
}

module.exports = {
    sendTemplate,
    notifyComplaintCreated,
    notifyStatusUpdate,
    formatPhoneNumber
};
