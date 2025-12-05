import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import SimpleMap from "@/components/SimpleMap";

const NewsMap = () => {
  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 z-20">
        <Link to="/">
          <Button variant="outline" size="icon" className="bg-background/80 backdrop-blur-sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Map */}
      <SimpleMap />
    </div>
  );
};

export default NewsMap;