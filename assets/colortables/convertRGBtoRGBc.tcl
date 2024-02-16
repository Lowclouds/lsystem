package require json::write

puts "enter rgb color file name: "
set fname [gets stdin]
set f [open $fname]
if {$f == ""} {
    puts "Can't open $fname"
    exit
}
set raw [split [read $f] \n]
close $f
set ctable {}
foreach line $raw {
    set l [split $line " "]
    set l [join [lmap c $l {expr {round($c / 0.256)/1000.0}}] ","]
    lappend ctable "\[$l\]"
}
set f [open "out.rgb" w+]
puts $f "var wbgyr.CT = \[[join $ctable ,\n]\]"
#puts $f [json::write array $ctable]
close $f

       
