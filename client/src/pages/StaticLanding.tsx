import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  BookOpen,
  Target,
  UserCircle,
  BookOpenCheck,
  Trophy,
  Award,
  Medal,
  Phone,
  Mail,
  Users,
  Calendar,
  TrendingUp
} from 'lucide-react';

interface TopAchiever {
  studentName: string;
  batchName: string;
  rank: number;
  percentage: number;
  finalTotal: number;
  examTitle: string;
  monthYear: string;
}

export default function StaticLanding() {
  const [, setLocation] = useLocation();

  const { data: topAchievers = [], isLoading } = useQuery<TopAchiever[]>({
    queryKey: ['/api/top-achievers'],
  });

  // Group achievers by batch
  const achieversByBatch = topAchievers.reduce((acc, achiever) => {
    if (!acc[achiever.batchName]) {
      acc[achiever.batchName] = [];
    }
    acc[achiever.batchName].push(achiever);
    return acc;
  }, {} as Record<string, TopAchiever[]>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-32 left-40 w-28 h-28 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-36 h-36 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-xl flex items-center justify-center shadow-lg">
            <div className="text-white font-bold text-xl">GS</div>
          </div>
          <div>
            <h1 className="text-white font-bold text-base lg:text-lg leading-tight">
              GS Student Nursing Center by Golam Sarowar Sir
            </h1>
            <p className="text-blue-200 text-xs lg:text-sm">Mathematics & Science Coaching Center</p>
          </div>
        </div>

        <Button
          onClick={() => setLocation('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-lg"
          data-testid="button-login-nav"
        >
          <UserCircle className="w-4 h-4 mr-2" />
          Login
        </Button>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 lg:px-12 py-12 lg:py-20">
        {/* Hero Section */}
        <div className="text-center mb-12 lg:mb-16">
          {/* Three Icon Badges */}
          <div className="flex justify-center mb-8">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-2xl shadow-lg flex items-center gap-3">
              <div className="bg-blue-600 p-3 rounded-xl">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div className="bg-green-600 p-3 rounded-xl">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div className="bg-orange-500 p-3 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Main Heading */}
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-4">
            GS Student Nursing Center
          </h2>
          
          {/* Subheading with Teacher Name */}
          <p className="text-2xl lg:text-3xl font-bold text-yellow-400 mb-6">
            by Golam Sarowar Sir
          </p>

          {/* Bengali Text */}
          <p className="text-xl lg:text-2xl text-white mb-3 font-medium">
            মুক্তেশরী নার্সিং সেন্টার এবং গোলাম সারোয়ার স্যার
          </p>

          {/* Secondary Bengali Text */}
          <p className="text-base lg:text-lg text-blue-100 mb-12 max-w-3xl mx-auto">
            শিক্ষার গুণমান নিশ্চিত করুন যাহা এখান থেকে তুমি পরীক্ষায় ভাল পরিদর্শন
          </p>

          {/* Three Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
            {/* Card 1 - শিখুন দক্ষতা */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover-elevate">
              <CardContent className="text-center py-8 px-6">
                <div className="bg-blue-600 p-4 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <GraduationCap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">শিখুন দক্ষতা</h3>
                <p className="text-gray-600 text-sm">
                  উচ্চতর শ্রেণীর শিক্ষার দিকে হিসাব মূল্যায়ন
                </p>
              </CardContent>
            </Card>

            {/* Card 2 - বিজ্ঞান শিক্ষা */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover-elevate">
              <CardContent className="text-center py-8 px-6">
                <div className="bg-green-600 p-4 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">বিজ্ঞান শিক্ষা</h3>
                <p className="text-gray-600 text-sm">
                  গণিত, উচ্চতর গণিত ও সাধারণ বিজ্ঞানের সম্পূর্ণ শিক্ষা
                </p>
              </CardContent>
            </Card>

            {/* Card 3 - লক্ষ্য অর্জন */}
            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover-elevate">
              <CardContent className="text-center py-8 px-6">
                <div className="bg-orange-500 p-4 rounded-xl w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">লক্ষ্য অর্জন</h3>
                <p className="text-gray-600 text-sm">
                  শিক্ষার দ্বারা লক্ষ্যের দিকে পৌঁছান স্বপ্নগুলি সাধন
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Achievers Section */}
          {!isLoading && Object.keys(achieversByBatch).length > 0 && (
            <div className="mb-16">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Trophy className="w-10 h-10 text-yellow-300" />
                <h3 className="text-3xl lg:text-5xl font-bold text-white">
                  মাসিক শ্রেষ্ঠত্ব
                </h3>
                <Trophy className="w-10 h-10 text-yellow-300" />
              </div>
              
              <p className="text-lg lg:text-xl text-yellow-200 mb-10 font-medium">
                শ্রেষ্ঠ ছাত্রদের সাফল্য - আমাদের গর্ব
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {Object.entries(achieversByBatch).map(([batchName, achievers]) => (
                  <Card key={batchName} className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover-elevate">
                    <CardHeader className="text-center pb-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-b">
                      <CardTitle className="text-lg font-bold text-gray-900">
                        {batchName}
                      </CardTitle>
                      {achievers[0] && (
                        <p className="text-xs text-gray-600 mt-1">
                          {achievers[0].monthYear}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                      {achievers.map((achiever, index) => {
                        const RankIcon = achiever.rank === 1 ? Trophy : achiever.rank === 2 ? Award : Medal;
                        const rankColor = achiever.rank === 1 ? 'text-yellow-500' : achiever.rank === 2 ? 'text-gray-500' : 'text-amber-700';
                        const bgColor = achiever.rank === 1 ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200' : achiever.rank === 2 ? 'bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-200' : 'bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200';
                        
                        return (
                          <div 
                            key={index} 
                            className={`flex items-center justify-between p-3 rounded-lg ${bgColor} shadow-sm`}
                            data-testid={`achiever-${batchName}-${achiever.rank}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0">
                                <RankIcon className={`w-7 h-7 ${rankColor}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-sm truncate">{achiever.studentName}</p>
                                <div className="flex gap-1 mt-1">
                                  <Badge className={achiever.rank === 1 ? 'bg-yellow-500 text-white text-xs px-2 py-0' : achiever.rank === 2 ? 'bg-gray-500 text-white text-xs px-2 py-0' : 'bg-amber-600 text-white text-xs px-2 py-0'}>
                                    #{achiever.rank}
                                  </Badge>
                                  <Badge className="bg-blue-600 text-white text-xs px-2 py-0">
                                    {parseFloat(String(achiever.percentage || 0)).toFixed(1)}%
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xl font-bold text-blue-700">{achiever.finalTotal}</p>
                              <p className="text-xs text-gray-600">মার্কস</p>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Available Courses Section */}
          <div className="mb-16">
            <h3 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              আমাদের কোর্স সমূহ
            </h3>
            <p className="text-lg lg:text-xl text-yellow-200 mb-10 font-medium">
              গণিত ও বিজ্ঞানে বিশেষায়িত শিক্ষা
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {/* Course 1: Science & Math for Classes 6-8 */}
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover-elevate">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <Badge className="bg-green-600 text-white px-3 py-1">বিজ্ঞান</Badge>
                      <Badge className="bg-blue-600 text-white px-3 py-1">গণিত</Badge>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">ক্লাস ৬ থেকে ৮</h4>
                    <p className="text-gray-600 mt-2 text-base">সাধারণ গণিত ও বিজ্ঞান</p>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>বিষয়সমূহ:</strong> বিজ্ঞান, সাধারণ গণিত
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>শ্রেণী:</strong> ষষ্ঠ, সপ্তম, অষ্টম
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <Badge className="bg-green-600 text-white px-3 py-1">চলমান</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Course 2: General Math & Higher Math for Classes 9-10 */}
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover-elevate">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <Badge className="bg-blue-600 text-white px-3 py-1">সাধারণ গণিত</Badge>
                      <Badge className="bg-purple-600 text-white px-3 py-1">উচ্চতর গণিত</Badge>
                    </div>
                    <h4 className="text-2xl font-bold text-gray-900">ক্লাস ৯ থেকে ১০</h4>
                    <p className="text-gray-600 mt-2 text-base">সাধারণ গণিত ও উচ্চতর গণিত</p>
                  </div>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-gray-700">
                      <strong>বিষয়সমূহ:</strong> সাধারণ গণিত, উচ্চতর গণিত
                    </p>
                    <p className="text-sm text-gray-700">
                      <strong>শ্রেণী:</strong> নবম, দশম
                    </p>
                  </div>
                  <div className="pt-3 border-t">
                    <Badge className="bg-green-600 text-white px-3 py-1">চলমান</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="mb-16">
            <h3 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              আমাদের সাফল্যের গল্প
            </h3>
            <p className="text-lg lg:text-xl text-yellow-200 mb-10 font-medium">
              সংখ্যায় আমাদের অর্জন
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover-elevate">
                <CardContent className="text-center py-10">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-5xl font-bold text-blue-700 mb-2">5000+</p>
                  <p className="text-gray-700 font-semibold text-lg">সফল শিক্ষার্থী</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover-elevate">
                <CardContent className="text-center py-10">
                  <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <Calendar className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-5xl font-bold text-green-700 mb-2">20+</p>
                  <p className="text-gray-700 font-semibold text-lg">বছরের অভিজ্ঞতা</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl hover-elevate">
                <CardContent className="text-center py-10">
                  <div className="bg-gradient-to-br from-orange-500 to-orange-700 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-10 h-10 text-white" />
                  </div>
                  <p className="text-5xl font-bold text-orange-700 mb-2">98%</p>
                  <p className="text-gray-700 font-semibold text-lg">সাফল্যের হার</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Founder Profile Section */}
          <div className="mb-16">
            <h3 className="text-3xl lg:text-5xl font-bold text-white mb-4">
              প্রতিষ্ঠাতার পরিচয়
            </h3>
            <p className="text-lg lg:text-xl text-yellow-200 mb-10 font-medium">
              আমাদের প্রতিষ্ঠাতার সাথে পরিচয়
            </p>

            <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                  <div className="flex-shrink-0">
                    <img 
                      src="/images/founder-profile.jpg" 
                      alt="Golam Sarowar Sir"
                      className="w-48 h-48 md:w-56 md:h-56 rounded-full object-cover shadow-xl border-4 border-blue-600"
                    />
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <h4 className="text-2xl font-bold text-gray-900 mb-1">
                      গোলাম সারোয়ার
                    </h4>
                    <p className="text-lg font-semibold text-blue-600 mb-2">
                      Golam Sarowar Sir
                    </p>
                    <p className="text-gray-600 mb-4">
                      গণিত ও বিজ্ঞান শিক্ষক - ২০+ বছরের অভিজ্ঞতা
                    </p>
                    
                    <div className="space-y-2 mb-6">
                      <p className="text-sm text-gray-700">
                        <strong>বিশেষত্ব:</strong> উচ্চতর গণিত ও সাধারণ গণিত বিশেষজ্ঞ
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>অর্জন:</strong> ৫০০০+ সফল শিক্ষার্থী
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>পদবী:</strong> Senior Math Teacher at Mohadebpur Sarba Mongala Pilot High School
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                      <a href="tel:01762602056" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium">
                        <Phone className="w-4 h-4" />
                        01762602056
                      </a>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <p className="text-sm text-gray-700 italic">
                        "With years of experience in Mathematics and Science education, I am committed to providing students with the knowledge and skills they need to excel in their academic journey. My goal is to make complex mathematical and scientific concepts accessible and engaging for every student."
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-900/90 backdrop-blur-sm border-t border-white/10 py-8">
        <div className="container mx-auto px-6 lg:px-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="bg-blue-600 p-2 rounded-lg flex items-center justify-center">
                <div className="text-white font-bold text-lg">GS</div>
              </div>
              <div>
                <h3 className="text-white font-bold text-base">
                  GS Student Nursing Center by Golam Sarowar Sir
                </h3>
                <p className="text-blue-200 text-sm">Excellence in Mathematics & Science Education</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-4">
              <Phone className="w-4 h-4 text-blue-400" />
              <a href="tel:01762602056" className="text-blue-400 hover:text-blue-300 font-medium">
                01762602056
              </a>
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-gray-400 text-sm">
                © 2025 All Rights Reserved | Created by{' '}
                <a 
                  href="https://www.facebook.com/shahid.rahman111" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-medium"
                  data-testid="link-creator"
                >
                  Sahid Rahman
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
