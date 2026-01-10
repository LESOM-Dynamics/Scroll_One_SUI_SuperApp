"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { motion } from "framer-motion";

interface TeamMember {
  name: string;
  role: string;
  quote: string;
  image: string;
}

interface TeamProps {
  members?: TeamMember[];
  className?: string;
}

// Team members data - easily expandable by adding more objects to this array
const defaultMembers: TeamMember[] = [
  {
    name: "Kevin Isom",
    role: "Tech Lead",
    quote: "Building Scroll One has been an incredible journey. We're bringing Web3 to everyone, one feature at a time.",
    image: "https://media.licdn.com/dms/image/v2/D4D03AQELXdPv639O4w/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1699938883733?e=2147483647&v=beta&t=t41UBuuI4uxkug3KyHx8bHcoBSCYoO8Hw-QL9IFlBps"
  },
  {
    name: "Mercy Wairimu",
    role: "Marketing Lead",
    quote: "Technology should be invisible. We're making blockchain so seamless, users won't even think about it.",
    image: "https://media.licdn.com/dms/image/v2/D4D03AQFGWLxJwKzUHg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1723220871043?e=2147483647&v=beta&t=ZnXjWhi_C6sQuidmV2-8tts_CXFiahKIRvwGxhDYakI"
  },
];

export default function Team({ members = defaultMembers, className }: TeamProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        
        .team-section * {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
      <div className={cn("team-section flex flex-wrap items-center justify-center gap-6", className)}>
        {members.map((member, index) => (
          <motion.div
            key={`${member.name}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className="max-w-80 bg-black text-white rounded-2xl overflow-hidden"
          >
            <div className="relative -mt-px overflow-hidden rounded-2xl">
              <div className="relative h-[270px] w-full">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="rounded-2xl hover:scale-105 transition-all duration-300 object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 320px"
                />
                <div className="absolute bottom-0 z-10 h-60 w-full bg-gradient-to-t pointer-events-none from-black to-transparent"></div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <p className="font-medium border-b border-gray-600 pb-5">"{member.quote}"</p>
              <p className="mt-4">— {member.name}</p>
              <p className="text-sm font-medium bg-gradient-to-r from-[#8B5CF6] via-[#E0724A] to-[#9938CA] text-transparent bg-clip-text">
                {member.role}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );
}