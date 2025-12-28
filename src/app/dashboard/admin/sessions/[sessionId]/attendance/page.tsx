import { AttendanceView } from '@/sections/attendance/view';

// ----------------------------------------------------------------------

type Props = {
  params: Promise<{
    sessionId: string;
  }>;
};

export default async function AttendanceRecordPage(props: Props) {
  const { sessionId } = await props.params;

  return <AttendanceView sessionId={sessionId} />;
}

