// Admin pages are server-rendered on demand; show a fallback while they load.
export default function AdminLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        color: '#AAAAAA',
      }}
    >
      Loading...
    </div>
  );
}
