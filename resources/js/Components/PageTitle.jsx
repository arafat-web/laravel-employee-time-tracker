import React from 'react';
import { Head } from '@inertiajs/react';

/**
 * Sets the browser tab title: "<title> — Time Tracker".
 * Use inside any page: <PageTitle title="My Time" />
 */
export default function PageTitle({ title }) {
    return <Head title={title} />;
}
