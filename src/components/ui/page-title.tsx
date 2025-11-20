import React from "react";

function PageTitle({ title }: { title: string }) {
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-600 mb-5">{title}</h1>
    </div>
  );
}

export default PageTitle;
