
        var _config = {
          "url" : "https://4viqg8ewa9.execute-api.ap-northeast-1.amazonaws.com/ug/search",
          "type" : "GET",
          "timeout" : 15000,
          "crossDomain" : true,
          "notsep": ["ja", "ko", "tc", "sc", "th"],
          "lang" : "ko",
          "fields" : {
              "title" : "title_ko",
              "text"  : "text_ko",
              "os"  : "os"
          },
          "query" : {
              "search" : {
                "fq" : "dt:'NPD6446-00_ko'",
                "return": ["name", "title_ko", "text_ko", "_score", "os"],
                "q.options": {  "defaultOperator" : "or",
                                "fields" : ["title_ko^5", "text_ko"]
                              },
                "highlight" : { "title" : {"max_phrases" : 5},
                                "text"  : {"max_phrases" : 5}
                              }
              },
              "autocomplete": {
                "fq" : "dt:'NPD6446-00_ko'",
                "return": ["title_ko"],
                "q.options": {  "defaultOperator" : "or",
                                "fields" : ["title_ko"]
                              }
              }
            },
            "message" : {
                "next": "다음",
                "prev": "이전",
                "resulttitle": "검색 키워드:",
                "hittext": "에",
                "hit": "항목",
                "nohit": "페이지를 찾을 수 없습니다.",
                "400": "검색하는 동안 오류가 발생했습니다.",
                "404": "검색하는 동안 오류가 발생했습니다.",
                "408": "검색 처리 시간이 초과되었습니다. 나중에 다시 검색하십시오.",
                "429": "검색하는 동안 오류가 발생했습니다. 나중에 다시 검색하십시오.",
                "503": "검색하는 동안 오류가 발생했습니다. 나중에 다시 검색하십시오.",
                "507": "검색하는 동안 오류가 발생했습니다. 나중에 다시 검색하십시오.",
                "509": "검색하는 동안 오류가 발생했습니다. 나중에 다시 검색하십시오.",
                "more": "기타",
                "back": "뒤로"
            },
            "behavior" : {
              "tab" : ["print", "copy", "scan", "mante", "fax"],
              "redirect": {
                
            "mediaempty" : "GUID-9E06E0B1-9146-4478-9D45-BC2C8522D27C.htm"
        ,
            "#003" : "GUID-09D6CBEA-EAAD-4566-90D6-97AFF19DCB26.htm"
        ,
            "#004" : "GUID-5601D48D-02F0-4D8E-9850-C3DDFA86B1D2.htm"
        ,
            "#001" : "GUID-6FA48F16-A399-4D4B-A27F-444D351207B3.htm"
        ,
            "#002" : "GUID-4BDD95E1-5F46-4784-9010-7DF0CF7E7253.htm"
        ,
            "#200" : "GUID-76195F7E-D12A-4DFA-BC1C-9AE2C12BB1F6.htm"
        ,
            "#205" : "GUID-C483C187-A009-4876-8EDB-C2D15194F557.htm"
        ,
            "other" : "GUID-7102105A-DCC8-41C1-A7DF-566D44FC657C.htm"
        ,
            "mediajam" : "GUID-8E29672E-8395-4F25-AA71-A96328BF2875.htm"
        ,
            "supplyempty" : "GUID-DBCBF8FF-59D8-404E-89AC-A8BE6D613039.htm"
        
              }
            }
        }
        