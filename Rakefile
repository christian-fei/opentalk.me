require "rubygems"

task :default => :m

task :m do
  sh "meteor"
end


###UPLOAD TO GH###
task :g do
  throw "WTF did you modify?" unless ARGV[1]
  mod = ""
  ARGV[1..ARGV.length - 1].each { |v| mod += " #{v}" }
  mod.strip!
  sh "git add ."
  sh "git commit -am ' #{mod} '"
  sh "git push"
  exit
end