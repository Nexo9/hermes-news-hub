 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { Button } from "@/components/ui/button";
 import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
   SheetTrigger,
 } from "@/components/ui/sheet";
 import {
   Menu,
   MessagesSquare,
   Map,
   FileText,
   Crown,
   Gamepad2,
   Heart,
 } from "lucide-react";
 import { HermesLogo } from "@/components/HermesLogo";
 
 interface MobileNavProps {
   className?: string;
 }
 
 export function MobileNav({ className }: MobileNavProps) {
   const [isOpen, setIsOpen] = useState(false);
   const navigate = useNavigate();
 
   const handleNavigate = (path: string) => {
     navigate(path);
     setIsOpen(false);
   };
 
   const navItems = [
     { icon: MessagesSquare, label: "Discussions", path: "/discussions" },
     { icon: Map, label: "Carte des Actualités", path: "/map" },
     { icon: FileText, label: "Charte d'Utilisation", path: "/terms" },
     { icon: Crown, label: "Premium", path: "/pricing" },
     { icon: Gamepad2, label: "Mini-Jeux", path: "/games" },
     { icon: Heart, label: "Contributions", path: "/contributions" },
   ];
 
   return (
     <Sheet open={isOpen} onOpenChange={setIsOpen}>
       <SheetTrigger asChild>
         <Button variant="ghost" size="icon" className={className}>
           <Menu className="h-5 w-5" />
           <span className="sr-only">Menu</span>
         </Button>
       </SheetTrigger>
       <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <HermesLogo size="sm" showText />
            </SheetTitle>
          </SheetHeader>
         <nav className="flex flex-col p-2">
           {navItems.map((item) => (
             <Button
               key={item.path}
               variant="ghost"
               className="justify-start gap-3 h-12 px-4"
               onClick={() => handleNavigate(item.path)}
             >
               <item.icon className="h-5 w-5" />
               {item.label}
             </Button>
           ))}
         </nav>
       </SheetContent>
     </Sheet>
   );
 }