import React, { useState } from "react";
import { IUser } from "@/interfaces";
import { Menu } from "lucide-react";
import MenuItems from "./menu-items";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

function Header({ user }: { user: IUser | null }) {
  const [openMenuItems, setOpenMenuItems] = useState<boolean>(false);
  
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="bg-black shadow-md relative">
        <div className="flex items-center justify-between px-6 py-6 w-full">
          {/* Logo - wider layout */}
          <Link href="/" className="flex items-center">
            <h1 className="text-3xl font-bold">
              <b className="text-white">Tracky</b>
              <b className="text-orange-600">.Fy</b>
            </h1>
          </Link>
          
          {/* User section */}
          <div className="flex items-center gap-6">
            {/* User info with gradient border */}
            {user && (
              <div className="hidden sm:flex items-center justify-center bg-gray-900 rounded-full pl-4 pr-1 py-1.5 border border-transparent bg-clip-padding relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 -z-10 blur-[1px] opacity-50"></div>
                <span className="text-sm font-medium text-white mr-3">{user.name}</span>
                <div className="rounded-full overflow-hidden flex items-center justify-center">
                  <UserButton />
                </div>
              </div>
            )}
            
            {/* Mobile view - just the avatar */}
            <div className="sm:hidden">
              <UserButton />
            </div>
            
            {/* Menu button - keeping as requested */}
            <Menu
              className="text-white cursor-pointer hover:text-orange-400 transition-colors"
              size={30}
              onClick={() => setOpenMenuItems(true)}
            />
          </div>
        </div>
      </div>
      
      {/* Menu items - keeping as requested */}
      {openMenuItems && user && (
        <MenuItems
          user={user}
          openMenuItems={openMenuItems}
          setOpenMenuItems={setOpenMenuItems}
        />
      )}
    </header>
  );
}

export default Header;
