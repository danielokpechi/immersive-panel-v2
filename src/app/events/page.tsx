// /events/ has no page of its own; send people to the Studio's events list.
export const metadata = { title: 'Connect Events' };

export default function Page() {
  return (
    <>
      <meta httpEquiv="refresh" content="0; url=./studio/" />
      <a href="./studio/">Open the Connect Events Studio</a>
    </>
  );
}
