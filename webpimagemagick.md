PS E:\etsy\144pics\birth> Get-ChildItem *.jpg, *.jpeg, *.png | ForEach-Object {
>>     magick $_.FullName -resize "1200x1500>" -strip -quality 82 ("optimized\" + $_.BaseName + ".webp")
