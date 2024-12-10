import CreateVideo from "@/components/create-video/CreateVideo";
import { FC } from "react";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

const EditVideoPage: FC<Props> = async ({ params }) => {
  const { id } = await params; // Await the params Promise

  return <CreateVideo video_id={id} />;
};

export default EditVideoPage;
